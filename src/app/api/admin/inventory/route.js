import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Get inventory status for all products and services
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get products with low stock alerts
    const products = await sql`
      SELECT 
        id, name, category, price, stock_quantity, low_stock_threshold, track_inventory,
        CASE 
          WHEN track_inventory = true AND stock_quantity <= low_stock_threshold THEN true
          ELSE false
        END as is_low_stock,
        CASE 
          WHEN track_inventory = true AND stock_quantity <= 0 THEN true
          ELSE false
        END as is_out_of_stock,
        updated_at
      FROM products 
      ORDER BY 
        CASE WHEN track_inventory = true AND stock_quantity <= 0 THEN 1 ELSE 0 END DESC,
        CASE WHEN track_inventory = true AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END DESC,
        name ASC
    `;

    // Get services with capacity alerts
    const services = await sql`
      SELECT 
        id, name, category, price, stock_quantity, low_stock_threshold, track_inventory,
        CASE 
          WHEN track_inventory = true AND stock_quantity <= low_stock_threshold THEN true
          ELSE false
        END as is_low_stock,
        CASE 
          WHEN track_inventory = true AND stock_quantity <= 0 THEN true
          ELSE false
        END as is_out_of_stock,
        updated_at
      FROM services 
      ORDER BY 
        CASE WHEN track_inventory = true AND stock_quantity <= 0 THEN 1 ELSE 0 END DESC,
        CASE WHEN track_inventory = true AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END DESC,
        name ASC
    `;

    // Get inventory alerts summary
    const alerts = await sql`
      SELECT 
        'product' as type,
        COUNT(*) FILTER (WHERE track_inventory = true AND stock_quantity <= 0) as out_of_stock,
        COUNT(*) FILTER (WHERE track_inventory = true AND stock_quantity <= low_stock_threshold AND stock_quantity > 0) as low_stock
      FROM products
      UNION ALL
      SELECT 
        'service' as type,
        COUNT(*) FILTER (WHERE track_inventory = true AND stock_quantity <= 0) as out_of_stock,
        COUNT(*) FILTER (WHERE track_inventory = true AND stock_quantity <= low_stock_threshold AND stock_quantity > 0) as low_stock
      FROM services
    `;

    return Response.json({
      products,
      services,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update inventory for products/services
export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type, // 'product' or 'service'
      id,
      stock_quantity,
      low_stock_threshold,
      track_inventory,
    } = await request.json();

    if (!type || !id) {
      return Response.json(
        {
          error: "Missing required fields: type, id",
        },
        { status: 400 },
      );
    }

    if (type !== "product" && type !== "service") {
      return Response.json(
        {
          error: "Invalid type. Must be 'product' or 'service'",
        },
        { status: 400 },
      );
    }

    const table = type === "product" ? "products" : "services";

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${values.length + 1}`);
      values.push(stock_quantity);
    }

    if (low_stock_threshold !== undefined) {
      updates.push(`low_stock_threshold = $${values.length + 1}`);
      values.push(low_stock_threshold);
    }

    if (track_inventory !== undefined) {
      updates.push(`track_inventory = $${values.length + 1}`);
      values.push(track_inventory);
    }

    if (updates.length === 0) {
      return Response.json(
        {
          error: "No fields to update",
        },
        { status: 400 },
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ${table} 
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const [updatedItem] = await sql(query, values);

    if (!updatedItem) {
      return Response.json(
        {
          error: `${type} not found`,
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      [type]: updatedItem,
      message: `${type} inventory updated successfully`,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
