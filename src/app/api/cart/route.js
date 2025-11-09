import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get cart items with product/service details
    const cartItems = await sql`
      SELECT 
        c.id as cart_id,
        c.item_type,
        c.quantity,
        c.created_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.image_url as product_image_url,
        p.category as product_category,
        s.id as service_id,
        s.name as service_name,
        s.description as service_description,
        s.price as service_price,
        s.image_url as service_image_url,
        s.category as service_category
      FROM cart_items c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN services s ON c.service_id = s.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at DESC
    `;

    const formattedItems = cartItems.map((item) => ({
      cart_id: item.cart_id,
      item_type: item.item_type,
      quantity: item.quantity,
      created_at: item.created_at,
      item:
        item.item_type === "product"
          ? {
              id: item.product_id,
              name: item.product_name,
              description: item.product_description,
              price: item.product_price,
              image_url: item.product_image_url,
              category: item.product_category,
            }
          : {
              id: item.service_id,
              name: item.service_name,
              description: item.service_description,
              price: item.service_price,
              image_url: item.service_image_url,
              category: item.service_category,
            },
    }));

    const total = formattedItems.reduce((sum, item) => {
      return sum + parseFloat(item.item.price) * item.quantity;
    }, 0);

    return Response.json({
      cart_items: formattedItems,
      total: total.toFixed(2),
      count: formattedItems.length,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      item_type,
      product_id,
      service_id,
      quantity = 1,
    } = await request.json();

    if (!item_type || (item_type !== "product" && item_type !== "service")) {
      return Response.json({ error: "Invalid item_type" }, { status: 400 });
    }

    if (item_type === "product" && !product_id) {
      return Response.json(
        { error: "product_id is required for products" },
        { status: 400 },
      );
    }

    if (item_type === "service" && !service_id) {
      return Response.json(
        { error: "service_id is required for services" },
        { status: 400 },
      );
    }

    // Check if item already exists in cart
    let existingItem;
    if (item_type === "product") {
      existingItem = await sql`
        SELECT * FROM cart_items 
        WHERE user_id = ${userId} AND product_id = ${product_id} AND item_type = 'product'
      `;
    } else {
      existingItem = await sql`
        SELECT * FROM cart_items 
        WHERE user_id = ${userId} AND service_id = ${service_id} AND item_type = 'service'
      `;
    }

    if (existingItem.length > 0) {
      // Update quantity
      const newQuantity = existingItem[0].quantity + quantity;
      await sql`
        UPDATE cart_items 
        SET quantity = ${newQuantity}, updated_at = NOW()
        WHERE id = ${existingItem[0].id}
      `;
    } else {
      // Insert new item
      await sql`
        INSERT INTO cart_items (user_id, item_type, product_id, service_id, quantity)
        VALUES (${userId}, ${item_type}, ${product_id || null}, ${service_id || null}, ${quantity})
      `;
    }

    return Response.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { cart_id } = await request.json();

    if (!cart_id) {
      return Response.json({ error: "cart_id is required" }, { status: 400 });
    }

    await sql`
      DELETE FROM cart_items 
      WHERE id = ${cart_id} AND user_id = ${userId}
    `;

    return Response.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { cart_id, quantity } = await request.json();

    if (!cart_id || !quantity || quantity < 1) {
      return Response.json(
        { error: "cart_id and valid quantity are required" },
        { status: 400 },
      );
    }

    await sql`
      UPDATE cart_items 
      SET quantity = ${quantity}, updated_at = NOW()
      WHERE id = ${cart_id} AND user_id = ${userId}
    `;

    return Response.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Error updating cart:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
