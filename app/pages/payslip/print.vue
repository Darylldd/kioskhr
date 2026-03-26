<script setup lang="ts">
useSeoMeta({
  title: 'Payslip Print'
})
definePageMeta({ layout: false })

const data = ref<any>(null)

onMounted(() => {
  const raw = sessionStorage.getItem('print_payslip_data')
  if (!raw) { window.close(); return }
  data.value = JSON.parse(raw)
  sessionStorage.removeItem('print_payslip_data')
  nextTick(() => setTimeout(() => window.print(), 400))
})

function fmt(n: any) { return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
function printPage() { window.print() }

const cutoffDisplay = computed(() => {
  if (!data.value) return ''
  if (data.value.cutoff === 'FIRST_HALF')  return '1st Half'
  if (data.value.cutoff === 'SECOND_HALF') return '2nd Half'
  return data.value.cutoff
})

const monthLabel = computed(() => {
  if (!data.value?.month) return ''
  const [y, m] = data.value.month.split('-')
  const names = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
  return m && y ? `${names[parseInt(m) - 1]} ${y}` : data.value.month
})
</script>

<template>
  <div v-if="data" style="width:800px;margin:0 auto;font-family:Arial,sans-serif;padding:40px;background:#fff;position:relative;">

    <img src="/images/uhi.png" alt="" style="position:absolute;top:-6px;left:0;width:350px;height:auto;opacity:0.9;" />

    <div style="display:flex;align-items:center;justify-content:flex-start;margin-bottom:20px;position:relative;z-index:1;">
      <img src="/images/bp.png"     alt="Bagong Pilipinas" style="height:65px;margin-right:15px;" />
      <img src="/images/dabfar.png" alt="BFAR"             style="height:65px;margin-right:25px;" />
      <div style="font-size:12px;line-height:1.3;">
        <strong>Republic of the Philippines</strong><br />
        Department of Agriculture<br />
        <strong>BUREAU OF FISHERIES AND AQUATIC RESOURCES</strong><br />
        <span style="color:#1a4d80;font-weight:bold;font-size:14px;">REGIONAL FISHERIES OFFICE - MIMAROPA</span><br />
        Barangay Sapul, Calapan City 5200, Oriental Mindoro<br />
        Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189<br />
        <span style="font-size:11px;color:#0000EE;text-decoration:underline;">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</span>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:25px;">
      <h2 style="margin:0;letter-spacing:3px;font-weight:bold;color:#333;">PAY SLIP</h2>
      <strong>{{ monthLabel }}<span v-if="cutoffDisplay"> - {{ cutoffDisplay }}</span></strong>
    </div>

    <div style="margin-bottom:15px;font-size:14px;line-height:1.6;">
      <strong>Name: {{ (data.employee_name || '').toUpperCase() }}</strong><br />
      <strong>Account No.: {{ data.account_no }}</strong>
    </div>

    <table style="width:100%;border-collapse:collapse;border:2px solid #000;font-size:13px;">
      <thead>
        <tr style="text-align:center;font-weight:bold;background-color:#c0ecf8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
          <td style="border:1px solid #000;width:25%;padding:8px;">EARNINGS</td>
          <td style="border:1px solid #000;width:20%;padding:8px;">Amount</td>
          <td style="border:1px solid #000;width:35%;padding:8px;">DEDUCTIONS</td>
          <td style="border:1px solid #000;width:20%;padding:8px;">Amount</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border-right:1px solid #000;padding:8px;vertical-align:top;">Basic Pay</td>
          <td style="border-right:1px solid #000;padding:8px;text-align:right;vertical-align:top;">{{ fmt(data.basic_pay) }}</td>
          <td style="border-right:1px solid #000;padding:0;">
            <div v-for="label in ['LATE/ABSENCES','PAG-IBIG (MP1)','PAG-IBIG (MP2)','PAG-IBIG (MPL)','PAG-IBIG (Calamity Loan)','SSS','PHILHEALTH','TAX','DISALLOWANCES']"
              :key="label" style="border-bottom:1px solid #eee;padding:6px 8px;">{{ label }}</div>
          </td>
          <td style="padding:0;text-align:right;">
            <div v-for="key in ['late_absences','pagibig_mp1','pagibig_mp2','pagibig_mpl','pagibig_calamity','sss','philhealth','tax','disallowances']"
              :key="key" style="border-bottom:1px solid #eee;padding:6px 8px;">{{ fmt(data[key]) }}</div>
          </td>
        </tr>
        <tr style="font-weight:bold;">
          <td style="border:1px solid #000;padding:8px;">Total Earnings</td>
          <td style="border:1px solid #000;padding:8px;text-align:right;">{{ fmt(data.basic_pay) }}</td>
          <td style="border:1px solid #000;padding:8px;text-align:right;">Total Deductions</td>
          <td style="border:1px solid #000;padding:8px;text-align:right;">{{ fmt(data.totalDeductions) }}</td>
        </tr>
        <tr>
          <td colspan="2" style="border:none;"></td>
          <td style="border:1px solid #000;padding:8px;text-align:right;font-weight:bold;background-color:#c0ecf8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">Net Pay</td>
          <td style="border:1px solid #000;padding:8px;text-align:right;font-weight:bold;background-color:#c0ecf8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">{{ fmt(data.netPay) }}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:15px;text-align:right;font-size:12px;"><em>Prepared by: HRMU</em></div>
  </div>
</template>

<style>
@media print {
  @page { margin: 0; size: auto; }
  body { padding: 0; margin: 0; }
}
</style>