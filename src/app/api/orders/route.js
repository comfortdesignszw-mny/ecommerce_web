import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get user's order history
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get orders with their items
    const orders = await sql`
      SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'item_type', oi.item_type,
              'item_name', oi.item_name,
              'item_description', oi.item_description,
              'item_category', oi.item_category,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'product_id', oi.product_id,
              'service_id', oi.service_id
            ) ORDER BY oi.created_at
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ${userId}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    return Response.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Create a new order
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      payment_method,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      delivery_address,
      delivery_city,
      delivery_notes,
      payment_details,
    } = await request.json();

    // Validate required fields
    if (
      !payment_method ||
      !customer_first_name ||
      !customer_last_name ||
      !customer_email ||
      !customer_phone ||
      !delivery_address ||
      !delivery_city
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get cart items
    const cartItems = await sql`
      SELECT 
        c.id as cart_id,
        c.item_type,
        c.quantity,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.category as product_category,
        p.stock_quantity as product_stock,
        p.track_inventory as product_track_inventory,
        s.id as service_id,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.category as service_category,
        s.stock_quantity as service_stock,
        s.track_inventory as service_track_inventory
      FROM cart_items c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN services s ON c.service_id = s.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at
    `;

    if (cartItems.length === 0) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Check inventory for products
    for (const item of cartItems) {
      if (item.item_type === "product" && item.product_track_inventory) {
        if (item.product_stock < item.quantity) {
          return Response.json(
            {
              error: `Insufficient stock for ${item.product_name}. Available: ${item.product_stock}, Requested: ${item.quantity}`,
            },
            { status: 400 },
          );
        }
      }
      if (item.item_type === "service" && item.service_track_inventory) {
        if (item.service_stock < item.quantity) {
          return Response.json(
            {
              error: `Insufficient capacity for ${item.service_name}. Available: ${item.service_stock}, Requested: ${item.quantity}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price =
        item.item_type === "product" ? item.product_price : item.service_price;
      return sum + parseFloat(price) * item.quantity;
    }, 0);

    const total = subtotal; // No shipping charges for now

    // Generate unique order number
    const orderNumber = `CD${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    // Start transaction
    const result = await sql.transaction(async (txn) => {
      // Create order
      const [order] = await txn`
        INSERT INTO orders (
          user_id, order_number, payment_method, subtotal, total,
          customer_first_name, customer_last_name, customer_email, customer_phone,
          delivery_address, delivery_city, delivery_notes, payment_details
        ) VALUES (
          ${userId}, ${orderNumber}, ${payment_method}, ${subtotal}, ${total},
          ${customer_first_name}, ${customer_last_name}, ${customer_email}, ${customer_phone},
          ${delivery_address}, ${delivery_city}, ${delivery_notes || null}, ${JSON.stringify(payment_details || {})}
        ) RETURNING *
      `;

      // Create order items and update inventory
      for (const item of cartItems) {
        const itemName =
          item.item_type === "product" ? item.product_name : item.service_name;
        const itemDescription =
          item.item_type === "product"
            ? item.product_description
            : item.service_description;
        const itemCategory =
          item.item_type === "product"
            ? item.product_category
            : item.service_category;
        const unitPrice =
          item.item_type === "product"
            ? item.product_price
            : item.service_price;
        const totalPrice = parseFloat(unitPrice) * item.quantity;

        // Insert order item
        await txn`
          INSERT INTO order_items (
            order_id, ${item.item_type === "product" ? sql`product_id` : sql`service_id`}, 
            item_type, item_name, item_description, item_category, 
            quantity, unit_price, total_price
          ) VALUES (
            ${order.id}, ${item.item_type === "product" ? item.product_id : item.service_id},
            ${item.item_type}, ${itemName}, ${itemDescription}, ${itemCategory},
            ${item.quantity}, ${unitPrice}, ${totalPrice}
          )
        `;

        // Update inventory
        if (item.item_type === "product" && item.product_track_inventory) {
          await txn`
            UPDATE products 
            SET stock_quantity = stock_quantity - ${item.quantity},
                updated_at = NOW()
            WHERE id = ${item.product_id}
          `;
        }
        if (item.item_type === "service" && item.service_track_inventory) {
          await txn`
            UPDATE services 
            SET stock_quantity = stock_quantity - ${item.quantity},
                updated_at = NOW()
            WHERE id = ${item.service_id}
          `;
        }

        // Remove from cart
        await txn`
          DELETE FROM cart_items WHERE id = ${item.cart_id}
        `;
      }

      // Queue email notification
      await txn`
        INSERT INTO email_notifications (
          user_id, email, type, subject, body, order_id, metadata
        ) VALUES (
          ${userId}, ${customer_email}, 'order_confirmation',
          ${"Order Confirmation - " + orderNumber},
          ${"Thank you for your order! Your order " + orderNumber + " has been received and is being processed."},
          ${order.id}, ${JSON.stringify({ order_number: orderNumber })}
        )
      `;

      return order;
    });

    return Response.json(
      {
        success: true,
        order: result,
        message: "Order placed successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
