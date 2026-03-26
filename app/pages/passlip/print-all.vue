<script setup lang="ts">
useSeoMeta({
  title: 'Print All'
})

definePageMeta({ layout: false })

const records   = ref<any[]>([])
const typeLabel = ref('')
const query     = ref('')
const printed   = ref('')

onMounted(() => {
  const raw = sessionStorage.getItem('print_passlip_all')
  if (!raw) { window.close(); return }
  const data = JSON.parse(raw)
  records.value   = data.records   || []
  typeLabel.value = data.typeLabel || ''
  query.value     = data.query     || ''
  printed.value   = data.printed   || ''
  sessionStorage.removeItem('print_passlip_all')
  nextTick(() => setTimeout(() => window.print(), 400))
})

function fmtDate(d: any) {
  if (!d) return '—'
  const date = d?._seconds ? new Date(d._seconds * 1000) : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="print-area">
    <div class="ph">
      <h2>Pass Slip Records — {{ typeLabel }}</h2>
      <p v-if="query">Filtered: "{{ query }}" · {{ records.length }} record{{ records.length !== 1 ? 's' : '' }} · {{ printed }}</p>
      <p v-else>{{ records.length }} record{{ records.length !== 1 ? 's' : '' }} · Printed: {{ printed }}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Passlip No</th>
          <th>Date</th>
          <th>Employee</th>
          <th>Emp ID</th>
          <th>Department / Division</th>
          <th>Office / Agency to Visit</th>
          <th>Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in records" :key="r.id || i">
          <td>{{ i + 1 }}</td>
          <td>{{ r.passlip_no }}</td>
          <td>{{ fmtDate(r.pass_date) }}</td>
          <td>{{ r.employee_name }}</td>
          <td>{{ r.employee_id || '—' }}</td>
          <td>{{ r.department }}</td>
          <td>{{ r.office_visit }}</td>
          <td>{{ r.purpose }}</td>
        </tr>
        <tr v-if="records.length === 0">
          <td colspan="8" style="text-align:center; padding: 20px; color: #999;">No records to print.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 14px 18px; font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; }
.print-area { width: 100%; }
.ph { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #555; }
.ph h2 { font-size: 11px; font-weight: 700; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.4px; }
.ph p  { font-size: 8.5px; color: #555; margin: 0; }
table { width: 100%; border-collapse: collapse; font-size: 9px; }
th { border: 1px solid #888; padding: 4px 5px; font-weight: 700; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; text-align: left; background: #fff; }
td { border: 1px solid #bbb; padding: 4px 5px; vertical-align: top; }
@media print {
  @page { margin: 10mm; }
  body { padding: 0; }
}
</style>