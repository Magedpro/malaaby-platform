import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://embnhywhpzrkwnjprtgv.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYm5oeXdocHpya3duanBydGd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2NzU1NCwiZXhwIjoyMTAwMDQzNTU0fQ.mLAkeGKn5Lr9rLd5hKF1DtG-qfLAlSf6GRthc5U-YsM";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestStadium() {
  try {
    // Add stadium
    const { error: stadiumError } = await supabase
      .from("stadiums")
      .insert([
        {
          slug: "demo",
          owner_id: "test-owner-001",
          data: {
            id: "stadium-001",
            name: "ملعب التجربة",
            slug: "demo",
            description: "ملعب تجريبي لاختبار النظام",
            city: "القاهرة",
            address: "شارع النيل، القاهرة",
            phone: "0201000000000",
            whatsapp: "20201000000000",
            logo: null,
            coverImage: null,
            googleMapsUrl: "https://maps.google.com",
            vodafoneCash: null,
            instaPay: null,
            paymentInstructions: null,
            isActive: true,
            approvalStatus: "approved",
            subscription: "premium",
          },
        },
      ]);

    if (stadiumError) {
      console.error("❌ Stadium error:", stadiumError);
      return;
    }

    console.log("✅ Stadium added: demo");

    // Add field
    const { error: fieldError } = await supabase
      .from("fields")
      .insert([
        {
          id: "field-001",
          stadium_slug: "demo",
          data: {
            id: "field-001",
            name: "الملعب الرئيسي",
            description: "ملعب كبير للدوري الممتاز",
            pricePerHour: 200,
            bookingDuration: 60,
            coverImage: null,
            openingTime: "06:00",
            closingTime: "23:00",
            status: "available",
          },
        },
      ]);

    if (fieldError) {
      console.error("❌ Field error:", fieldError);
      return;
    }

    console.log("✅ Field added: field-001");
    console.log("✅ All done! Visit: http://localhost:3000/demo");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addTestStadium();
