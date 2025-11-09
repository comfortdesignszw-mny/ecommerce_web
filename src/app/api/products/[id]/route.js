import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: result[0] });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const setClauses = [];
    const values = [];

    // Build dynamic update query
    const allowedFields = [
      "name",
      "description",
      "price",
      "image_url",
      "category",
      "is_new_arrival",
      "is_hot_sale",
      "sale_percent",
    ];

    for (const field of allowedFields) {
      if (body.hasOwnProperty(field)) {
        setClauses.push(`${field} = $${values.length + 1}`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = [
        "computers",
        "smartphones",
        "bluetooth-speakers",
        "solar-products",
      ];
      if (!validCategories.includes(body.category)) {
        return Response.json({ error: "Invalid category" }, { status: 400 });
      }
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE products 
      SET ${setClauses.join(", ")} 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: result[0] });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const result = await sql`
      DELETE FROM products WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
