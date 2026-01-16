// Página de detalhes da pessoa
'use client';
import React from 'react';
import PessoaDetails from '@/components/pessoas/PessoaDetails';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface PageProps { 
  params: Promise<{ id: string }> 
}

export default function PessoaDetailsPage({ params }: PageProps) {
  const { id } = React.use(params);
  
  return (
    <DashboardLayout>
      <PessoaDetails id={id} />
    </DashboardLayout>
  );
}
