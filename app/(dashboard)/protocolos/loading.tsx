export default function ProtocolosLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {['Nome', 'Equipamentos', 'Ações'].map((h) => (
                  <th key={h} className="p-3">
                    <div className="h-4 w-20 bg-muted rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3"><div className="h-4 w-40 bg-muted rounded" /></td>
                  <td className="p-3"><div className="h-4 w-32 bg-muted rounded" /></td>
                  <td className="p-3"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
