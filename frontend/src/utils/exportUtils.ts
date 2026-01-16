// Imports dinâmicos para compatibilidade com Next.js

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
  }>;
}

export const exportToExcel = async (exportData: ExportData[], filename: string = 'relatorio') => {
  try {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      console.warn('Exportação Excel não disponível no servidor');
      return false;
    }

    // Import dinâmico do XLSX com tratamento de erro
    let XLSX;
    try {
      XLSX = await import('xlsx');
    } catch (importError) {
      console.error('Erro ao importar XLSX:', importError);
      return false;
    }
    
    if (!XLSX || !XLSX.utils) {
      console.error('XLSX não carregado corretamente');
      return false;
    }
    
    const workbook = XLSX.utils.book_new();
    
    exportData.forEach((sheet, index) => {
      // Preparar dados para Excel
      const excelData = sheet.data.map(row => {
        const excelRow: any = {};
        sheet.columns.forEach(col => {
          excelRow[col.label] = row[col.key] || '';
        });
        return excelRow;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar largura das colunas
      const colWidths = sheet.columns.map(() => ({ wch: 20 }));
      worksheet['!cols'] = colWidths;
      
      // Limitar o nome da planilha a 31 caracteres (limite do Excel)
      const sheetName = sheet.title.length > 31 ? sheet.title.substring(0, 31) : sheet.title;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Gerar arquivo
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

export const exportToPDF = async (exportData: ExportData[], filename: string = 'relatorio') => {
  try {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      console.warn('Exportação PDF não disponível no servidor');
      return false;
    }

    // Import dinâmico do jsPDF com tratamento de erro
    let jsPDF;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default;
      await import('jspdf-autotable');
    } catch (importError) {
      console.error('Erro ao importar jsPDF:', importError);
      return false;
    }
    
    if (!jsPDF) {
      console.error('jsPDF não carregado corretamente');
      return false;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Configurações
    const titleFontSize = 16;
    const headerFontSize = 12;
    const bodyFontSize = 10;
    const margin = 20;
    const lineHeight = 7;
    
    exportData.forEach((sheet, sheetIndex) => {
      if (sheetIndex > 0) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Título do relatório
      doc.setFontSize(titleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('SIVI+360° - Relatório de Estatísticas', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Data de geração
      doc.setFontSize(bodyFontSize);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;
      
      // Título da seção
      doc.setFontSize(headerFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text(sheet.title, margin, yPosition);
      yPosition += 10;
      
      // Preparar dados para tabela
      const tableData = sheet.data.map(row => 
        sheet.columns.map(col => row[col.key] || '')
      );
      
      const tableHeaders = sheet.columns.map(col => col.label);
      
      // Adicionar tabela
      (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: bodyFontSize,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: (data: any) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    });
    
    // Salvar arquivo
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    return false;
  }
};

// Interface para filtros de exportação
export interface ExportFilters {
  dataInicio: string;
  dataFim: string;
  estado: string;
  orgao: string;
  incluirCampos: {
    numero: boolean;
    visitante: boolean;
    efetivo: boolean;
    orgao: boolean;
    estado: boolean;
    motivo: boolean;
    dataEntrada: boolean;
    dataSaida: boolean;
    observacoes: boolean;
    dataRegistro: boolean;
  };
}

// Funções específicas para exportação de visitas
export const exportVisitasToExcel = async (visitas: any[], filename: string = 'visitas', filters?: ExportFilters) => {
  try {
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();
    
    // Preparar dados para Excel baseado nos filtros
    const excelData = visitas.map(visita => {
      const row: any = {};
      
      if (!filters || filters.incluirCampos.numero) {
        row['Número'] = visita.numero || '';
      }
      if (!filters || filters.incluirCampos.visitante) {
        row['Visitante'] = visita.visitante_obj?.nome || visita.visitante_obj?.designacao_social || '';
      }
      if (!filters || filters.incluirCampos.efetivo) {
        row['Efetivo a Visitar'] = visita.efetivo_visitar_obj?.nome_completo || '';
      }
      if (!filters || filters.incluirCampos.orgao) {
        row['Órgão'] = visita.orgao_obj?.sigla || visita.orgao_obj?.nome || '';
      }
      if (!filters || filters.incluirCampos.estado) {
        row['Estado'] = visita.estado || '';
      }
      if (!filters || filters.incluirCampos.motivo) {
        row['Motivo'] = visita.motivo || '';
      }
      if (!filters || filters.incluirCampos.dataEntrada) {
        row['Data/Hora Entrada'] = visita.data_hora_entrada ? new Date(visita.data_hora_entrada).toLocaleString('pt-BR') : '';
      }
      if (!filters || filters.incluirCampos.dataSaida) {
        row['Data/Hora Saída'] = visita.data_hora_saida ? new Date(visita.data_hora_saida).toLocaleString('pt-BR') : '';
      }
      if (filters && filters.incluirCampos.observacoes) {
        row['Observações'] = visita.observacoes || '';
      }
      if (filters && filters.incluirCampos.dataRegistro) {
        row['Data de Registro'] = visita.data_registo ? new Date(visita.data_registo).toLocaleString('pt-BR') : '';
      }
      
      return row;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // Número
      { wch: 25 }, // Visitante
      { wch: 25 }, // Efetivo
      { wch: 20 }, // Órgão
      { wch: 12 }, // Estado
      { wch: 30 }, // Motivo
      { wch: 20 }, // Data Entrada
      { wch: 20 }, // Data Saída
      { wch: 30 }, // Observações
      { wch: 20 }  // Data Registro
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitas');
    
    // Gerar arquivo
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar visitas para Excel:', error);
    return false;
  }
};

export const exportVisitasToPDF = async (visitas: any[], filename: string = 'visitas', filters?: ExportFilters) => {
  try {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF('landscape'); // Modo paisagem para melhor visualização
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Configurações
    const headerFontSize = 10;
    const bodyFontSize = 9;
    const margin = 15;

    // Helper: carregar imagem pública como DataURL
    const loadImageAsDataURL = (src: string) => new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context inválido'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = src;
    });

    const logoDataUrl = await loadImageAsDataURL('/insignia.png').catch(() => undefined);
    const rodapeDataUrl = await loadImageAsDataURL('/rodape?.png').catch(() => undefined);

    // Função para desenhar cabeçalho institucional (apenas primeira página)
    const drawInstitutionHeader = () => {
      // Logo centralizado
      if (logoDataUrl) {
        const logoWidth = 20; // mm
        const logoHeight = 20;
        doc.addImage(logoDataUrl, 'PNG', (pageWidth - logoWidth) / 2, 6, logoWidth, logoHeight);
      }

      // Linhas de título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const lines = [
        'REPÚBLICA DE ANGOLA',
        'MINISTÉRIO DO INTERIOR',
        'SERVIÇO DE INVESTIGAÇÃO CRIMINAL',
        'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL'
      ];
      let y = 32;
      lines.forEach((text, index) => {
        doc.text(text, pageWidth / 2, y, { align: 'center' });
        // Sublinhado apenas na última linha (DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL)
        if (index === lines.length - 1) {
          const w = doc.getTextWidth(text);
          doc.line((pageWidth - w) / 2, y + 1.5, (pageWidth + w) / 2, y + 1.5);
        }
        y += 6;
      });
    };

    // Função para desenhar rodapé institucional (apenas numeração de página)
    const drawInstitutionFooter = (pageNumber: number, pageCount: number) => {
      // Numeração de página (EM TODAS AS PÁGINAS)
      doc.setFontSize(8).setTextColor(100).text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.setTextColor(0);
    };

    // Função para desenhar a área de assinatura dinamicamente
    const drawSignatureArea = (startY: number) => {
      const neededHeight = 45; // Espaço necessário para a assinatura
      const footerReservedHeight = 40; // Espaço reservado para o rodapé institucional no fim da página
      const bottomLimit = pageHeight - footerReservedHeight;

      let currentY = startY + 10;

      // Se não couber na página atual, adicionar nova página
      if (currentY + neededHeight > bottomLimit) {
        doc.addPage();
        currentY = 40; // Começar mais abaixo se for nova página para dar contexto
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('"INTELIGÊNCIA – AUDÁCIA - LEALDADE"', pageWidth / 2, currentY, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const data = new Date();
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      const mesAtual = meses[data.getMonth()];
      const anoAtual = data.getFullYear();
      const linhaLocalData = `DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL, em Luanda, _____ de Dezembro de ${anoAtual}.`;
      doc.text(linhaLocalData, pageWidth / 2, currentY + 8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('O ESPECIALISTA,', pageWidth / 2, currentY + 22, { align: 'center' });
      doc.line(pageWidth / 2 - 35, currentY + 28, pageWidth / 2 + 35, currentY + 28);
    };
    
    // Preparar dados para tabela baseado nos filtros
    const tableData = visitas.map(visita => {
      const row: string[] = [];
      
      if (!filters || filters.incluirCampos.numero) {
        row.push(visita.numero || '');
      }
      if (!filters || filters.incluirCampos.visitante) {
        row.push(visita.visitante_obj?.nome || visita.visitante_obj?.designacao_social || '');
      }
      if (!filters || filters.incluirCampos.efetivo) {
        row.push(visita.efetivo_visitar_obj?.nome_completo || '');
      }
      if (!filters || filters.incluirCampos.orgao) {
        row.push(visita.orgao_obj?.sigla || visita.orgao_obj?.nome || '');
      }
      if (!filters || filters.incluirCampos.estado) {
        row.push(visita.estado || '');
      }
      if (!filters || filters.incluirCampos.motivo) {
        row.push(visita.motivo || '');
      }
      if (!filters || filters.incluirCampos.dataEntrada) {
        row.push(visita.data_hora_entrada ? new Date(visita.data_hora_entrada).toLocaleString('pt-BR') : '');
      }
      if (!filters || filters.incluirCampos.dataSaida) {
        row.push(visita.data_hora_saida ? new Date(visita.data_hora_saida).toLocaleString('pt-BR') : '');
      }
      if (filters && filters.incluirCampos.observacoes) {
        row.push(visita.observacoes || '');
      }
      if (filters && filters.incluirCampos.dataRegistro) {
        row.push(visita.data_registo ? new Date(visita.data_registo).toLocaleString('pt-BR') : '');
      }
      
      return row;
    });
    
    const tableHeaders: string[] = [];
    if (!filters || filters.incluirCampos.numero) tableHeaders.push('Número');
    if (!filters || filters.incluirCampos.visitante) tableHeaders.push('Visitante');
    if (!filters || filters.incluirCampos.efetivo) tableHeaders.push('Efetivo a Visitar');
    if (!filters || filters.incluirCampos.orgao) tableHeaders.push('Órgão');
    if (!filters || filters.incluirCampos.estado) tableHeaders.push('Estado');
    if (!filters || filters.incluirCampos.motivo) tableHeaders.push('Motivo');
    if (!filters || filters.incluirCampos.dataEntrada) tableHeaders.push('Data/Hora Entrada');
    if (!filters || filters.incluirCampos.dataSaida) tableHeaders.push('Data/Hora Saída');
    if (filters && filters.incluirCampos.observacoes) tableHeaders.push('Observações');
    if (filters && filters.incluirCampos.dataRegistro) tableHeaders.push('Data de Registro');
    
    // Adicionar informações do relatório (depois do cabeçalho institucional)
    drawInstitutionHeader();
    const startY = 60;
    let currentY = startY;
    
    // Informações do relatório
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de visitas: ${visitas.length}`, margin, currentY);
    currentY += 8;
    
    if (filters) {
      const filtrosAplicados = [];
      if (filters.dataInicio) filtrosAplicados.push(`Data início: ${new Date(filters.dataInicio).toLocaleDateString('pt-BR')}`);
      if (filters.dataFim) filtrosAplicados.push(`Data fim: ${new Date(filters.dataFim).toLocaleDateString('pt-BR')}`);
      if (filters.estado && filters.estado !== 'todos') filtrosAplicados.push(`Estado: ${filters.estado}`);
      if (filters.orgao && filters.orgao !== 'todos') {
        filtrosAplicados.push(`Órgão: ${filters.orgao}`);
      }
      
      if (filtrosAplicados.length > 0) {
        doc.text(`Filtros aplicados: ${filtrosAplicados.join(', ')}`, margin, currentY);
        currentY += 8;
      }
    }
    
    currentY += 5; // Espaço antes da tabela

    // Adicionar tabela
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: bodyFontSize,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [30, 64, 175], // Azul profissional (blue-800)
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: headerFontSize,
        cellPadding: { top: 6, right: 4, bottom: 6, left: 4 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Número
        1: { cellWidth: 40 }, // Visitante
        2: { cellWidth: 40 }, // Efetivo
        3: { cellWidth: 30, halign: 'center' }, // Órgão
        4: { cellWidth: 25, halign: 'center' }, // Estado
        5: { cellWidth: 50 }, // Motivo
        6: { cellWidth: 35, halign: 'center' }, // Data Entrada
        7: { cellWidth: 35, halign: 'center' }, // Data Saída
        8: { cellWidth: 40 }, // Observações
        9: { cellWidth: 35, halign: 'center' }  // Data Registro
      },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        drawInstitutionFooter(data.pageNumber, pageCount);
      },
    });

    // Posição final da tabela
    const finalY = (doc as any).lastAutoTable.finalY;
    
    // Desenhar a área de assinatura após a tabela
    drawSignatureArea(finalY);
    
    // Salvar arquivo
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar visitas para PDF:', error);
    return false;
  }
};

export const printVisitas = (visitas: any[], filters?: ExportFilters) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Visitas - SIVI+360°</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          background-color: #2980b9;
          color: white;
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          border-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .info-section {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          border-left: 4px solid #2980b9;
        }
        .info-section p {
          margin: 5px 0;
          font-size: 12px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px 8px;
          text-align: left;
          font-size: 11px;
          vertical-align: middle;
        }
        th {
          background-color: #34495e;
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #e8f4f8;
        }
        .number-col, .status-col, .org-col, .date-col {
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SIVI+360° - Relatório de Visitas</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <div class="info-section">
        <p><strong>Total de visitas:</strong> ${visitas.length}</p>
        ${filters ? `
          <p><strong>Filtros aplicados:</strong> 
            ${[
              filters.dataInicio ? `Data início: ${new Date(filters.dataInicio).toLocaleDateString('pt-BR')}` : '',
              filters.dataFim ? `Data fim: ${new Date(filters.dataFim).toLocaleDateString('pt-BR')}` : '',
              filters.estado && filters.estado !== 'todos' ? `Estado: ${filters.estado}` : '',
              filters.orgao && filters.orgao !== 'todos' ? `Órgão: ${filters.orgao}` : ''
            ].filter(Boolean).join(', ') || 'Nenhum filtro aplicado'}
          </p>
        ` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            ${(!filters || filters.incluirCampos.numero) ? '<th>Número</th>' : ''}
            ${(!filters || filters.incluirCampos.visitante) ? '<th>Visitante</th>' : ''}
            ${(!filters || filters.incluirCampos.efetivo) ? '<th>Efetivo a Visitar</th>' : ''}
            ${(!filters || filters.incluirCampos.orgao) ? '<th>Órgão</th>' : ''}
            ${(!filters || filters.incluirCampos.estado) ? '<th>Estado</th>' : ''}
            ${(!filters || filters.incluirCampos.motivo) ? '<th>Motivo</th>' : ''}
            ${(!filters || filters.incluirCampos.dataEntrada) ? '<th>Data/Hora Entrada</th>' : ''}
            ${(!filters || filters.incluirCampos.dataSaida) ? '<th>Data/Hora Saída</th>' : ''}
            ${(filters && filters.incluirCampos.observacoes) ? '<th>Observações</th>' : ''}
            ${(filters && filters.incluirCampos.dataRegistro) ? '<th>Data de Registro</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${visitas.map(visita => `
            <tr>
              ${(!filters || filters.incluirCampos.numero) ? `<td class="number-col">${visita.numero || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.visitante) ? `<td>${visita.visitante_obj?.nome || visita.visitante_obj?.designacao_social || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.efetivo) ? `<td>${visita.efetivo_visitar_obj?.nome_completo || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.orgao) ? `<td class="org-col">${visita.orgao_obj?.sigla || visita.orgao_obj?.nome || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.estado) ? `<td class="status-col">${visita.estado || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.motivo) ? `<td>${visita.motivo || ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.dataEntrada) ? `<td class="date-col">${visita.data_hora_entrada ? new Date(visita.data_hora_entrada).toLocaleString('pt-BR') : ''}</td>` : ''}
              ${(!filters || filters.incluirCampos.dataSaida) ? `<td class="date-col">${visita.data_hora_saida ? new Date(visita.data_hora_saida).toLocaleString('pt-BR') : ''}</td>` : ''}
              ${(filters && filters.incluirCampos.observacoes) ? `<td>${visita.observacoes || ''}</td>` : ''}
              ${(filters && filters.incluirCampos.dataRegistro) ? `<td class="date-col">${visita.data_registo ? new Date(visita.data_registo).toLocaleString('pt-BR') : ''}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Total de visitas: ${visitas.length}</p>
        <p>SIVI+360° - Sistema Integrado de Visitas e Segurança</p>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
  
  return true;
};

export const generateReportData = (estatisticas: any) => {
  const reportData: ExportData[] = [];
  
  // 1. Estatísticas Gerais
  reportData.push({
    title: 'Estatísticas Gerais',
    columns: [
      { key: 'metric', label: 'Métrica' },
      { key: 'value', label: 'Valor' }
    ],
    data: [
      { metric: 'Total de Visitas', value: estatisticas.estatisticas_gerais.total_visitas },
      { metric: 'Total de Visitantes', value: estatisticas.estatisticas_gerais.total_visitantes },
      { metric: 'Total de Efetivos', value: estatisticas.estatisticas_gerais.total_efetivos },
      { metric: 'Total de Pertences', value: estatisticas.estatisticas_gerais.total_pertences },
      { metric: 'Total de Órgãos', value: estatisticas.estatisticas_gerais.total_orgaos },
    ]
  });
  
  // 2. Visitas por Estado
  reportData.push({
    title: 'Visitas por Estado',
    columns: [
      { key: 'estado', label: 'Estado' },
      { key: 'total', label: 'Total' }
    ],
    data: estatisticas.visitas_por_estado
  });
  
  // 3. Visitas por Órgão
  reportData.push({
    title: 'Visitas por Órgão',
    columns: [
      { key: 'orgao__nome', label: 'Órgão' },
      { key: 'total', label: 'Total' }
    ],
    data: estatisticas.visitas_por_orgao
  });
  
  // 4. Top Visitantes
  reportData.push({
    title: 'Top 10 Visitantes Frequentes',
    columns: [
      { key: 'visitante__nome', label: 'Visitante' },
      { key: 'total_visitas', label: 'Total de Visitas' }
    ],
    data: estatisticas.top_visitantes
  });
  
  // 5. Top Efetivos
  reportData.push({
    title: 'Top 10 Efetivos Visitados',
    columns: [
      { key: 'efetivo_visitar__nome_completo', label: 'Efetivo' },
      { key: 'total_visitas', label: 'Total de Visitas' }
    ],
    data: estatisticas.top_efetivos
  });
  
  // 6. Visitas por Mês
  reportData.push({
    title: 'Visitas por Mês',
    columns: [
      { key: 'nome_mes', label: 'Mês' },
      { key: 'total', label: 'Total' }
    ],
    data: estatisticas.visitas_por_mes
  });
  
  // 7. Visitas por Dia da Semana
  reportData.push({
    title: 'Visitas por Dia da Semana',
    columns: [
      { key: 'dia', label: 'Dia' },
      { key: 'total', label: 'Total' }
    ],
    data: estatisticas.visitas_por_dia_semana
  });
  
  // 8. Pertences por Estado
  reportData.push({
    title: 'Pertences por Estado',
    columns: [
      { key: 'estado', label: 'Estado' },
      { key: 'total', label: 'Total' }
    ],
    data: estatisticas.pertences_por_estado
  });
  
  return reportData;
};
