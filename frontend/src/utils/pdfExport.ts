import { AuditLog } from '@/services/auditService';

export const exportAuditLogsToPDF = async (logs: AuditLog[], filters?: any) => {
  try {
    // Criar conteúdo HTML para o PDF
    const htmlContent = generatePDFContent(logs, filters);
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão');
    }
    
    // Escrever o conteúdo HTML na janela
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw new Error('Erro ao gerar PDF');
  }
};

const generatePDFContent = (logs: AuditLog[], filters?: any): string => {
  const currentDate = new Date().toLocaleString('pt-BR');
  const totalLogs = logs.length;
  
  // Gerar cabeçalho
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Auditoria - SIVIS+360º</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .filters {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .filters h3 {
          margin: 0 0 10px 0;
          color: #374151;
        }
        .filters p {
          margin: 5px 0;
          color: #6b7280;
        }
        .summary {
          background: #eff6ff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary h3 {
          margin: 0 0 10px 0;
          color: #1d4ed8;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background-color: #f3f4f6;
          font-weight: bold;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .user-info {
          font-size: 11px;
        }
        .user-name {
          font-weight: bold;
        }
        .user-email {
          color: #6b7280;
        }
        .user-role {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }
        .action-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .entity-badge {
          background: #ecfdf5;
          color: #065f46;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Auditoria</h1>
        <p>Sistema SIVIS+360º</p>
        <p>Gerado em: ${currentDate}</p>
      </div>
  `;
  
  // Adicionar filtros se existirem
  if (filters && Object.keys(filters).length > 0) {
    html += `
      <div class="filters">
        <h3>Filtros Aplicados</h3>
    `;
    
    if (filters.entidade) html += `<p><strong>Entidade:</strong> ${filters.entidade}</p>`;
    if (filters.acao) html += `<p><strong>Ação:</strong> ${filters.acao}</p>`;
    if (filters.usuario) html += `<p><strong>Usuário:</strong> ${filters.usuario}</p>`;
    if (filters.data_inicio) html += `<p><strong>Data Início:</strong> ${filters.data_inicio}</p>`;
    if (filters.data_fim) html += `<p><strong>Data Fim:</strong> ${filters.data_fim}</p>`;
    
    html += `</div>`;
  }
  
  // Adicionar resumo
  html += `
    <div class="summary">
      <h3>Resumo</h3>
      <p><strong>Total de registros:</strong> ${totalLogs}</p>
      <p><strong>Período:</strong> ${logs.length > 0 ? 
        `${new Date(logs[logs.length - 1].data_hora).toLocaleDateString('pt-BR')} a ${new Date(logs[0].data_hora).toLocaleDateString('pt-BR')}` : 
        'N/A'}</p>
    </div>
  `;
  
  // Adicionar tabela de logs
  html += `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuário</th>
          <th>Ação</th>
          <th>Entidade</th>
          <th>Data/Hora</th>
          <th>Detalhes</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // Adicionar cada log
  logs.forEach(log => {
    const userInfo = log.usuario_info;
    const userDisplay = userInfo ? 
      `<div class="user-info">
        <div class="user-name">${userInfo.nome_completo}</div>
        <div class="user-email">${userInfo.email}</div>
        <div class="user-role">${userInfo.perfil}</div>
       </div>` : 
      '<span style="color: #6b7280;">Sistema</span>';
    
    const actionBadge = `<span class="action-badge">${log.acao}</span>`;
    const entityBadge = `<span class="entity-badge">${log.entidade}</span>`;
    const dateTime = new Date(log.data_hora).toLocaleString('pt-BR');
    
    // Detalhes dos dados (limitado para PDF)
    let details = '';
    if (log.dados_anteriores || log.dados_novos) {
      details = 'Dados alterados';
    }
    
    html += `
      <tr>
        <td>${log.id}</td>
        <td>${userDisplay}</td>
        <td>${actionBadge}</td>
        <td>${entityBadge}</td>
        <td>${dateTime}</td>
        <td>${details}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
    
    <div class="footer">
      <p>Relatório gerado automaticamente pelo Sistema SIVIS+360º</p>
      <p>Para mais informações, acesse o sistema de auditoria</p>
    </div>
  </body>
  </html>
  `;
  
  return html;
};
