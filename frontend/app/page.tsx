'use client';

import Link from 'next/link';
import { Camera, Zap, TrendingUp, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-600">Nutri-Vision</h1>
        <div className="space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-primary-600">Entrar</Link>
          <Link href="/register" className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">
            Começar
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Descubra o que você está comendo
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tire uma foto da sua refeição e receba análise nutricional completa com calorias, 
            macros e sugestões para uma alimentação mais equilibrada.
          </p>
          <Link 
            href="/register"
            className="inline-block bg-primary-500 text-white text-lg px-8 py-4 rounded-xl hover:bg-primary-600 shadow-lg"
          >
            Experimentar Grátis
          </Link>
          <p className="mt-4 text-sm text-gray-500">20 créditos grátis para começar</p>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Camera className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Foto Simples</h3>
              <p className="text-gray-600">Tire uma foto do seu prato e nossa IA identifica os alimentos automaticamente.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Zap className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Análise Rápida</h3>
              <p className="text-gray-600">Receba calorias, proteínas, carboidratos e gorduras em segundos.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <TrendingUp className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sugestões Práticas</h3>
              <p className="text-gray-600">Veja como melhorar sua refeição com sugestões visuais.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <Shield className="w-12 h-12 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Transparência</h3>
              <p className="text-gray-600">Mostramos faixas de estimativa e nível de confiança.</p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Como Funciona</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Fotografe</h3>
                <p className="text-gray-600">Tire uma foto do seu prato, sobremesa ou bebida</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Analise</h3>
                <p className="text-gray-600">Nossa IA identifica alimentos e calcula nutrientes</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Melhore</h3>
                <p className="text-gray-600">Receba sugestões para uma versão mais saudável</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Pacotes de Créditos</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white border rounded-xl p-6 text-center">
              <h3 className="font-semibold text-lg">Inicial</h3>
              <p className="text-3xl font-bold my-4">50</p>
              <p className="text-gray-600 mb-4">créditos</p>
              <p className="text-primary-600 font-semibold">R$ 9,90</p>
            </div>
            <div className="bg-white border-2 border-primary-500 rounded-xl p-6 text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs px-3 py-1 rounded-full">
                Popular
              </span>
              <h3 className="font-semibold text-lg">Básico</h3>
              <p className="text-3xl font-bold my-4">100</p>
              <p className="text-gray-600 mb-4">créditos</p>
              <p className="text-primary-600 font-semibold">R$ 17,90</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center">
              <h3 className="font-semibold text-lg">Avançado</h3>
              <p className="text-3xl font-bold my-4">300</p>
              <p className="text-gray-600 mb-4">créditos</p>
              <p className="text-primary-600 font-semibold">R$ 44,90</p>
            </div>
            <div className="bg-white border rounded-xl p-6 text-center">
              <h3 className="font-semibold text-lg">Pro</h3>
              <p className="text-3xl font-bold my-4">1000</p>
              <p className="text-gray-600 mb-4">créditos</p>
              <p className="text-primary-600 font-semibold">R$ 129,90</p>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-6">
            Análise simples: 5 créditos | Análise completa: 12 créditos
          </p>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">Nutri-Vision Web - Análise nutricional inteligente</p>
          <p className="text-sm text-gray-500 mt-2">
            Esta ferramenta é informativa e não substitui orientação profissional.
          </p>
        </div>
      </footer>
    </div>
  );
}
