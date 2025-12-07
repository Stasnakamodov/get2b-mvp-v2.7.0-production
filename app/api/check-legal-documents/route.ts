import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient";

// GET: Проверка юридических документов в заявках
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');


    if (applicationId) {
      // Проверяем конкретную заявку
      const { data: application, error } = await supabase
        .from('accreditation_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        return NextResponse.json({ 
          error: "Заявка не найдена" 
        }, { status: 404 });
      }

      // Парсим данные юридических документов
      let legalDocumentsData = [];
      try {
        legalDocumentsData = typeof application.legal_documents_data === 'string' 
          ? JSON.parse(application.legal_documents_data) 
          : application.legal_documents_data || [];
      } catch (parseError) {
        logger.error('Ошибка парсинга legal_documents_data:', parseError);
      }

      return NextResponse.json({
        success: true,
        application: {
          id: application.id,
          supplier_name: application.supplier_name,
          legal_documents_count: application.legal_documents_count,
          legal_documents_data: legalDocumentsData,
          legal_confirmation: application.legal_confirmation ? JSON.parse(application.legal_confirmation) : null
        }
      });
    } else {
      // Получаем все заявки с информацией о юридических документах
      const { data: applications, error } = await supabase
        .from('accreditation_applications')
        .select('id, supplier_name, legal_documents_count, legal_documents_data, legal_confirmation')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ 
          error: "Ошибка получения заявок" 
        }, { status: 500 });
      }

      const processedApplications = applications.map(app => {
        let legalDocumentsData = [];
        try {
          legalDocumentsData = typeof app.legal_documents_data === 'string' 
            ? JSON.parse(app.legal_documents_data) 
            : app.legal_documents_data || [];
        } catch (parseError) {
          logger.error('Ошибка парсинга legal_documents_data:', parseError);
        }

        return {
          id: app.id,
          supplier_name: app.supplier_name,
          legal_documents_count: app.legal_documents_count,
          legal_documents_data: legalDocumentsData,
          has_legal_confirmation: !!app.legal_confirmation
        };
      });

      return NextResponse.json({
        success: true,
        applications: processedApplications,
        summary: {
          total: processedApplications.length,
          with_legal_docs: processedApplications.filter(app => app.legal_documents_data.length > 0).length,
          total_legal_docs: processedApplications.reduce((sum, app) => sum + app.legal_documents_data.length, 0)
        }
      });
    }

  } catch (error) {
    logger.error("❌ [LEGAL-DOCS] Ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
} 