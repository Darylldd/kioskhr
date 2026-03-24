<script setup lang="ts">
useSeoMeta({
  title: 'Print Passlip'
})

definePageMeta({ layout: false })

const passlip = ref<any>(null)

onMounted(() => {
  const raw = sessionStorage.getItem('print_passlip_data')
  if (!raw) { window.close(); return }
  const data = JSON.parse(raw)
  passlip.value = data.passlip
  sessionStorage.removeItem('print_passlip_data')
  nextTick(() => setTimeout(() => window.print(), 400))
})

function fmtDate(d: any) {
  if (!d) return ''
  const date = d?._seconds ? new Date(d._seconds * 1000) : new Date(d)
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
}

function printPage() { window.print() }
</script>

<template>
  <div v-if="passlip">
    <div class="paper-container">
      <img src="/images/uhi.png" class="top-left-banner" alt="" />
      <img src="/images/uhitddd.png" class="bottom-right-banner" alt="" />
      <div class="paper-content">

        <div class="header-section">
          <div class="logos">
            <img src="/images/bp.png" alt="Bagong Pilipinas" />
            <img src="/images/dabfar.png" alt="DA / BFAR" />
          </div>
          <div class="header-text">
            Republic of the Philippines<br />
            Department of Agriculture<br />
            <strong>BUREAU OF FISHERIES AND AQUATIC RESOURCES</strong><br />
            REGIONAL FISHERIES OFFICE-MIMAROPA<br />
            Barangay Sapul, Calapan City, Oriental Mindoro, 5200<br />
            Tel. No. (043) 288-6305 | Mobile No. 0917-107-2189<br />
            <span style="color:blue; text-decoration:underline;">ord.mimaropa@bfar.da.gov.ph | records.mimaropa@bfar.da.gov.ph</span>
          </div>
        </div>

        <div class="form-border">
          <div class="section">
            <div class="control-no">
              <label>Control No:</label>
              <input type="text" :value="passlip.passlip_no" readonly />
            </div>
            <h2 class="section-title">PASS SLIP</h2>
            <div class="pass-slip-top">
              <div class="left-fields">
                <div class="input-group">
                  <label>DATE:</label>
                  <input type="text" :value="fmtDate(passlip.pass_date)" readonly />
                </div>
                <div class="input-group">
                  <label>NAME:</label>
                  <input type="text" :value="passlip.employee_name" readonly />
                </div>
                <div class="input-group">
                  <label>DIVISION:</label>
                  <input type="text" :value="passlip.department" readonly />
                </div>
                <div class="input-group">
                  <label>OFFICE/AGENCY TO VISIT:</label>
                  <input type="text" :value="passlip.office_visit" readonly />
                </div>
              </div>
              <div class="right-checkboxes">
                <div class="checkbox-item">
                  <input type="checkbox" :checked="passlip.type === 'regular'" disabled />
                  <span>Permanent</span>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" :checked="passlip.type !== 'regular'" disabled />
                  <span>COS</span>
                </div>
              </div>
            </div>

            <div class="purpose-section">
              <div class="input-group"><label>PURPOSE (specific):</label></div>
              <div class="purpose-lines">
                <input type="text" :value="passlip.purpose" readonly style="width:100%;" />
                <input type="text" readonly style="width:100%;" />
                <input type="text" readonly style="width:100%;" />
              </div>
            </div>

            <div class="signatures">
              <div class="sig-box">Signature over printed name of employee</div>
              <div class="sig-box">Signature over printed name of Immediate Supervisor</div>
            </div>
          </div>

          <div class="section section-divider">
            <h2 class="section-title">CERTIFICATION</h2>
            <div class="cert-paragraph">
              This is to certify that Mr./Ms.
              <strong class="cert-name-highlight">{{ passlip.employee_name }}</strong>
              of the Bureau of Fisheries and Aquatic Resources (BFAR) has personally appeared at the
              <span class="office-inline">
                <input type="text" :value="passlip.office_visit" readonly />
                <span class="sub-label">(Name of office)</span>
              </span>
              on the above stated purpose.
            </div>

            <div class="flex-row" style="margin-top:30px;">
              <div class="input-group" style="width:48%;"><label>Actual time of visit (log in):</label><input type="text" readonly /></div>
              <div class="input-group" style="width:48%;"><label>Actual time finished (log out):</label><input type="text" readonly /></div>
            </div>
            <div class="input-group" style="margin-top:25px;margin-bottom:20px;">
              <label>Name and signature of staff who assisted:</label><input type="text" readonly />
            </div>
            <div class="input-group" style="margin-bottom:20px;">
              <label>Position:</label><input type="text" style="width:50%;" readonly />
            </div>
            <div class="flex-row">
              <div class="input-group" style="width:48%;"><label>Mobile No:</label><input type="text" readonly /></div>
              <div class="input-group" style="width:48%;"><label>Telephone No:</label><input type="text" readonly /></div>
            </div>
          </div>
        </div>

        <div class="footer-info">
          <span>🌐 www.mimaropa.bfar.da.gov.ph</span>
          <span>ⓕ BFAR Mimaropa Region</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* { box-sizing: border-box; font-family: Arial, sans-serif; }
body { background-color: #fff; margin: 0; padding: 20px; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.paper-container { max-width: 850px; margin: 0 auto; position: relative; overflow: hidden; min-height: 100vh; }
.top-left-banner { position: absolute; top: 0; left: 0; width: 50%; max-width: 400px; z-index: 1; }
.bottom-right-banner { position: absolute; bottom: 0; right: 0; width: 50%; max-width: 400px; z-index: 1; }
.paper-content { position: relative; z-index: 2; padding: 40px 40px 30px 40px; }
.header-section { display: flex; align-items: center; justify-content: center; margin-bottom: 25px; position: relative; }
.logos { display: flex; align-items: center; gap: 15px; position: absolute; left: 0; top: 50%; transform: translateY(-50%); }
.logos img { max-height: 75px; }
.header-text { text-align: center; font-size: 11px; line-height: 1.4; color: #555; padding-left: 180px; }
.header-text strong { color: #333; font-size: 13px; font-weight: 700; }
.form-border { border: 2px solid #0e0e0e; margin-bottom: 10px; background-color: rgba(255,255,255,0.95); }
.form-border, .form-border * { font-family: "Times New Roman", Times, serif; color: #000; }
.section { padding: 30px; position: relative; }
.section-divider { border-top: 2px solid #0e0e0e; }
.section-title { text-align: center; color: #4a86e8 !important; font-weight: bold; font-size: 20px; margin-top: 0; margin-bottom: 30px; letter-spacing: 1px; }
.control-no { position: absolute; top: 20px; right: 30px; font-size: 13px; display: flex; align-items: center; gap: 10px; }
.control-no input { width: 120px; }
.flex-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
input[type="text"] { border: none; border-bottom: 1px solid #000; background: transparent; font-size: 14px; padding: 2px 5px; outline: none; color: #000; }
.input-group { display: flex; align-items: center; gap: 10px; }
.input-group label { font-size: 13px; white-space: nowrap; font-weight: bold; }
.input-group input { flex-grow: 1; min-width: 0; }
.pass-slip-top { display: flex; justify-content: space-between; }
.left-fields { width: 65%; display: flex; flex-direction: column; gap: 15px; }
.right-checkboxes { width: 30%; display: flex; flex-direction: column; gap: 10px; padding-top: 20px; font-size: 14px; font-weight: bold; }
.checkbox-item { display: flex; align-items: center; gap: 8px; }
.checkbox-item input[type="checkbox"] { width: 18px; height: 18px; border: 2px solid #4a86e8; }
.purpose-section { margin-top: 25px; }
.purpose-lines { display: flex; flex-direction: column; gap: 25px; margin-top: 10px; }
.signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
.sig-box { width: 45%; border-top: 1px solid #000; padding-top: 5px; font-size: 12px; font-style: italic; }
.cert-paragraph { font-size: 14px; line-height: 2.2; text-align: left; margin-bottom: 25px; }
.cert-name-highlight { border-bottom: 1px solid #000; padding: 0 10px; margin: 0 5px; font-weight: bold; display: inline-block; min-width: 150px; text-align: center; }
.office-inline { position: relative; display: inline-block; width: 300px; margin: 0 5px; }
.office-inline input { width: 100%; margin: 0; }
.office-inline .sub-label { position: absolute; top: 26px; left: 0; width: 100%; text-align: center; font-size: 11px; font-style: italic; color: #555; display: block; }
.footer-info { display: flex; align-items: center; gap: 20px; font-size: 12px; color: #666; padding: 10px 0; margin-bottom: 20px; }
@media print {
  @page { margin: 0; size: auto; }
  body { padding: 0; margin: 0; }
  .paper-container { box-shadow: none; max-width: 100%; border: none; }
  .top-left-banner { position: fixed !important; top: 0 !important; left: 0 !important; }
  .bottom-right-banner { position: fixed !important; bottom: 0 !important; right: 0 !important; }
  .paper-content { padding: 25px 35px 15px 35px; }
  .section { padding: 15px 25px; }
  .purpose-lines { gap: 15px; }
  .signatures { margin-top: 25px; }
  .cert-paragraph { line-height: 1.8; }
}
</style>