<script setup lang="ts">
import UniverseStage from './UniverseStage.vue';
import { useLocale } from '../i18n';
const { text } = useLocale();
</script>

<template>
  <section class="hero">
    <header class="hero__copy">
      <p class="hero__eyebrow">INTREPID UNIVERSE</p>
      <h1><span>VALUE</span><span>PROTECTION</span></h1>
      <p class="hero__statement">{{ text('One crew.', 'Một đội ngũ.') }}<br /><span>{{ text('Every orbit.', 'Mọi quỹ đạo.') }}</span></p>
      <p class="hero__description">{{ text('Explore the vault planets. Meet the protectors behind the work.', 'Khám phá các hành tinh tài nguyên. Kết nối những người bảo vệ giá trị.') }}</p>
      <div class="hero__horizon" aria-hidden="true"><span></span><i></i><span></span></div>
    </header>
    <div class="hero__visual"><UniverseStage /></div>
  </section>
</template>

<style lang="scss" scoped>
.hero { position:relative; z-index:1; display:grid; grid-template-columns:minmax(260px,.72fr) minmax(0,1.9fr); align-items:center; gap:clamp(12px,1.4vw,28px); width:100%; max-width:1760px; height:100%; min-height:0; overflow-y:auto; overscroll-behavior:contain; margin:0 auto; padding:20px clamp(24px,3.6vw,64px) 28px; }
.hero__copy { position:relative; z-index:2; align-self:center; padding:0 0 22px; max-width:390px; }
.hero__eyebrow { font-size:10px; line-height:1.5; letter-spacing:.3em; color:var(--color-cyan-400); margin-bottom:24px; }
.hero__copy h1 { display:flex; flex-direction:column; align-items:flex-start; gap:5px; font-size:clamp(36px,4.05vw,68px); line-height:.98; font-weight:700; letter-spacing:-.05em; margin:0; color:var(--color-text-400); }
.hero__copy h1>span:last-child { color:#c5a8fa; }
.hero__statement { margin-top:30px; font-size:clamp(20px,2vw,31px); line-height:1.25; letter-spacing:-.035em; color:var(--color-text-400); font-weight:500; }
.hero__statement>span { color:#ad9cc8; }
.hero__description { max-width:31ch; margin-top:18px; font-size:14px; line-height:1.75; color:var(--color-text-200); text-wrap:pretty; }
.hero__horizon { display:flex; align-items:center; gap:8px; width:min(172px,60%); margin-top:28px; color:#cfb87a; }
.hero__horizon>span { height:1px; background:linear-gradient(90deg,rgba(199,178,131,.45),transparent); flex:1; }.hero__horizon>span:first-child { flex:none; width:20px; background:rgba(199,178,131,.55); }.hero__horizon i { width:4px; height:4px; transform:rotate(45deg); background:#cfb87a; box-shadow:0 0 12px rgba(207,184,122,.5); }
.hero__visual { position:relative; min-width:0; width:100%; height:100%; min-height:530px; display:flex; align-items:stretch; }
@media(min-width:1500px) { .hero { gap:40px; }.hero__copy { padding-left:8px; }.hero__eyebrow { margin-bottom:30px; }.hero__description { font-size:15px; } }
@media(max-width:1099px) { .hero { display:flex; flex-direction:column; align-items:stretch; padding:24px 24px 12px; gap:6px; }.hero__copy { max-width:none; width:100%; padding:0 16px; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.8fr); gap:0 32px; align-items:center; }.hero__eyebrow { grid-column:1; margin-bottom:12px; font-size:9px; }.hero__copy h1 { grid-column:1; grid-row:2 / span 2; font-size:clamp(32px,5vw,48px); gap:2px; }.hero__statement { grid-column:2; grid-row:2; margin-top:0; font-size:23px; }.hero__description { grid-column:2; grid-row:3; margin-top:8px; max-width:38ch; font-size:12px; line-height:1.65; }.hero__horizon { display:none; }.hero__visual { min-height:500px; } }
@media(max-width:600px) { .hero { padding:16px 12px 8px; gap:14px; }.hero__copy { display:block; padding:0 8px; }.hero__eyebrow { font-size:8px; margin-bottom:9px; letter-spacing:.24em; }.hero__copy h1 { font-size:clamp(30px,7.5vw,41px); display:block; line-height:1.06; letter-spacing:-.045em; }.hero__copy h1>span { display:block; }.hero__statement { margin-top:14px; font-size:17px; line-height:1.35; }.hero__statement br { display:none; }.hero__statement>span { margin-left:6px; }.hero__description { font-size:12px; line-height:1.6; max-width:43ch; margin-top:8px; }.hero__visual { min-height:420px; height:420px; } }
@media(max-height:720px) and (min-width:1100px) { .hero { padding-top:8px; padding-bottom:12px; }.hero__visual { min-height:480px; }.hero__eyebrow { margin-bottom:18px; }.hero__statement { margin-top:22px; }.hero__description { margin-top:14px; }.hero__horizon { margin-top:20px; } }
</style>
