import { PawPrint } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <PawPrint className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-200 mb-2">Sem Conexão</h1>
        <p className="text-sm text-slate-400">
          Você está offline. As páginas visitadas anteriormente ainda estão disponíveis.
        </p>
      </div>
    </div>
  )
}
