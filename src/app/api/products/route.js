import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const newArrivals = url.searchParams.get("new_arrivals");
    const hotSales = url.searchParams.get("hot_sales");

    let query = "SELECT * FROM products WHERE 1=1";
    const values = [];

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    if (newArrivals === "true") {
      query += " AND is_new_arrival = true";
    }

    if (hotSales === "true") {
      query += " AND is_hot_sale = true";
    }

    query += " ORDER BY created_at DESC";

    const products = await sql(query, values);
    return Response.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      image_url,
      category,
      is_new_arrival,
      is_hot_sale,
      sale_percent,
    } = body;

    if (!name || !price || !category) {
      return Response.json(
        { error: "Missing required fields: name, price, category" },
        { status: 400 },
      );
    }

    const validCategories = [
      "computers",
      "smartphones",
      "bluetooth-speakers",
      "solar-products",
    ];
    if (!validCategories.includes(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO products (name, description, price, image_url, category, is_new_arrival, is_hot_sale, sale_percent)
      VALUES (${name}, ${description || null}, ${price}, ${image_url || null}, ${category}, ${is_new_arrival || false}, ${is_hot_sale || false}, ${sale_percent || 0})
      RETURNING *
    `;

    return Response.json({ product: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
