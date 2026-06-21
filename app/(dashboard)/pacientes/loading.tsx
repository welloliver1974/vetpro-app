export default function PacientesLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>

      <div className="h-10 w-72 bg-muted rounded-lg" />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {['Nome', 'Espécie', 'Tutor', 'Ações'].map((h) => (
                  <th key={h} className="p-3">
                    <div className="h-4 w-16 bg-muted rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="p-3">
                      <div className={`h-4 bg-muted rounded ${j === 3 ? 'w-12 ml-auto' : 'w-24'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
