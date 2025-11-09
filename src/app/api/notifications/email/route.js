import sql from "@/app/api/utils/sql";

// Process pending email notifications
export async function POST() {
  try {
    // Get pending email notifications
    const pendingEmails = await sql`
      SELECT * FROM email_notifications 
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 10
    `;

    const results = [];

    for (const notification of pendingEmails) {
      try {
        // Here you would integrate with an email service like:
        // - Resend
        // - SendGrid
        // - AWS SES
        // - Nodemailer with SMTP

        // For now, we'll simulate sending emails and log them
        console.log(`📧 Sending email to ${notification.email}:`);
        console.log(`Subject: ${notification.subject}`);
        console.log(`Body: ${notification.body}`);

        // Simulate email sending delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Mark as sent
        await sql`
          UPDATE email_notifications 
          SET status = 'sent', sent_at = NOW()
          WHERE id = ${notification.id}
        `;

        results.push({
          id: notification.id,
          email: notification.email,
          status: "sent",
        });
      } catch (emailError) {
        console.error(`Failed to send email ${notification.id}:`, emailError);

        // Mark as failed
        await sql`
          UPDATE email_notifications 
          SET status = 'failed'
          WHERE id = ${notification.id}
        `;

        results.push({
          id: notification.id,
          email: notification.email,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    return Response.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing email notifications:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Queue a new email notification
export async function PUT(request) {
  try {
    const { user_id, email, type, subject, body, order_id, metadata } =
      await request.json();

    if (!email || !type || !subject || !body) {
      return Response.json(
        {
          error: "Missing required fields: email, type, subject, body",
        },
        { status: 400 },
      );
    }

    const [notification] = await sql`
      INSERT INTO email_notifications (
        user_id, email, type, subject, body, order_id, metadata
      ) VALUES (
        ${user_id || null}, ${email}, ${type}, ${subject}, ${body}, 
        ${order_id || null}, ${JSON.stringify(metadata || {})}
      ) RETURNING *
    `;

    return Response.json({
      success: true,
      notification,
      message: "Email notification queued",
    });
  } catch (error) {
    console.error("Error queuing email notification:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
