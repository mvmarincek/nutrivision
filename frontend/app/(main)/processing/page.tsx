'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { jobsApi, mealsApi, JobResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function ProcessingContent() {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const mealId = searchParams.get('mealId');

  useEffect(() => {
    if (!token || !jobId) return;

    const pollJob = async () => {
      try {
        const result = await jobsApi.get(token, parseInt(jobId));
        setJob(result);

        if (result.status === 'completed') {
          router.push(`/result?mealId=${mealId}`);
        } else if (result.status === 'failed') {
          setError(result.erro || 'Erro na análise');
        } else if (result.status !== 'waiting_user') {
          setTimeout(pollJob, 2000);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    pollJob();
  }, [token, jobId, mealId, router]);

  const handleSubmitAnswers = async () => {
    if (!token || !mealId) return;
    setSubmitting(true);

    try {
      const result = await mealsApi.submitAnswers(token, parseInt(mealId), answers);
      router.push(`/processing?jobId=${result.job_id}&mealId=${mealId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">:(</div>
          <h2 className="text-xl font-bold mb-2">Erro na Análise</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (job?.status === 'waiting_user' && job.questions) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Perguntas Rápidas</h2>
          <p className="text-gray-600 mb-6">
            Para uma análise mais precisa, responda estas perguntas:
          </p>

          <div className="space-y-6">
            {job.questions.map((q) => (
              <div key={q.id}>
                <p className="font-medium mb-2">{q.question}</p>
                {q.options ? (
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswers({ ...answers, [q.id]: option })}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          answers[q.id] === option
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Digite sua resposta"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitAnswers}
            disabled={submitting || Object.keys(answers).length < job.questions.length}
            className="w-full mt-6 bg-primary-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Continuar Análise'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Analisando sua refeição...</h2>
        <p className="text-gray-600">{job?.etapa_atual || 'Iniciando análise...'}</p>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Carregando...</h2>
        </div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
