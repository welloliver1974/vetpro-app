export default function FinanceiroLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded-lg" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {['Paciente', 'Valor', 'Pagamento', 'Data'].map((h) => (
                  <th key={h} className="p-3">
                    <div className="h-4 w-20 bg-muted rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3"><div className="h-4 w-36 bg-muted rounded" /></td>
                  <td className="p-3"><div className="h-4 w-16 bg-muted rounded" /></td>
                  <td className="p-3"><div className="h-5 w-20 bg-muted rounded-full" /></td>
                  <td className="p-3"><div className="h-4 w-20 bg-muted rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
