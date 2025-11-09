import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const mostRequested = url.searchParams.get("most_requested");

    let query = "SELECT * FROM services WHERE 1=1";
    const values = [];

    if (category) {
      values.push(category);
      query += ` AND category = $${values.length}`;
    }

    if (mostRequested === "true") {
      query += " AND is_most_requested = true";
    }

    query += " ORDER BY created_at DESC";

    const services = await sql(query, values);
    return Response.json({ services });
  } catch (error) {
    console.error("GET /api/services error:", error);
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
    const { name, description, price, image_url, category, is_most_requested } =
      body;

    if (!name || !price || !category) {
      return Response.json(
        { error: "Missing required fields: name, price, category" },
        { status: 400 },
      );
    }

    const validCategories = [
      "web-development",
      "graphic-design",
      "digital-marketing",
      "consultation",
    ];
    if (!validCategories.includes(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO services (name, description, price, image_url, category, is_most_requested)
      VALUES (${name}, ${description || null}, ${price}, ${image_url || null}, ${category}, ${is_most_requested || false})
      RETURNING *
    `;

    return Response.json({ service: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
