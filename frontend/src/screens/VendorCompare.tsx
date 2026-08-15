import { useSession } from '../store/session'
import { Button } from '../components/Button'

export function VendorCompare() {
  const vendors = useSession((s) => s.vendors)
  const updateVendor = useSession((s) => s.updateVendor)
  const submitVendors = useSession((s) => s.submitVendors)

  const complete = vendors.every((v) => v.name && v.leadTimeDays && v.quantity && v.unitPrice)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">외주업체 비교</h1>
      <p className="text-sm text-neutral-500">납기·가능 수량·단가 기준으로 3개사를 정리하세요.</p>
      <div className="flex flex-col gap-4">
        {vendors.map((v, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
            <input
              placeholder={`업체 ${i + 1} 이름`}
              value={v.name}
              onChange={(e) => updateVendor(i, { name: e.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              placeholder="납기(일)"
              value={v.leadTimeDays}
              onChange={(e) => updateVendor(i, { leadTimeDays: e.target.value ? Number(e.target.value) : '' })}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              placeholder="가능 수량"
              value={v.quantity}
              onChange={(e) => updateVendor(i, { quantity: e.target.value ? Number(e.target.value) : '' })}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              placeholder="단가(원)"
              value={v.unitPrice}
              onChange={(e) => updateVendor(i, { unitPrice: e.target.value ? Number(e.target.value) : '' })}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={submitVendors} disabled={!complete}>
          업체 비교 자료 제출
        </Button>
      </div>
    </div>
  )
}
