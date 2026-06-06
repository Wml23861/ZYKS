<template>
  <div class="page-acupoints">
    <div class="page-header">
      <button class="back-btn" @click="$router.push({ name: 'recite-home' })">
        &larr; 返回
      </button>
      <h1 class="page-title">穴位背诵</h1>
      <p class="page-subtitle">经络腧穴定位、归经与主治，重点穴位全覆盖</p>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索穴位名称、拼音或编码..."
        class="search-input"
      />
    </div>

    <!-- 经络筛选 -->
    <div class="meridian-filters">
      <button
        :class="['filter-btn', { 'is-active': activeMeridian === '' }]"
        @click="activeMeridian = ''"
      >
        全部
      </button>
      <button
        v-for="mer in meridians"
        :key="mer"
        :class="['filter-btn', { 'is-active': activeMeridian === mer }]"
        @click="activeMeridian = mer"
      >
        {{ mer }}
      </button>
    </div>

    <div class="acupoints-grid">
      <div
        v-for="(point, index) in filteredPoints"
        :key="index"
        class="acupoint-card"
        :class="{ 'is-revealed': revealedMap[index] }"
      >
        <div class="acupoint-front" @click="toggleReveal(index)">
          <!-- el-image: JPG实拍优先 → SVG定位图回退 → 解剖SVG兜底 -->
          <div class="acupoint-image-wrap">
            <el-image
              v-show="!failedAcuImages.has(point.name)"
              :src="getAcuImageSrc(point.name)"
              :preview-src-list="[getAcuImageSrc(point.name)]"
              :preview-teleported="true"
              fit="cover"
              class="acupoint-photo"
              @error="() => onAcuImgError(point.name)"
            />
            <AcupointIllustration
              v-if="failedAcuImages.has(point.name)"
              :code="point.code"
              :name="point.name"
              :region="point.region"
            />
          </div>
          <div class="point-code">{{ point.code }}</div>
          <h3 class="point-name">{{ point.name }}</h3>
          <p class="point-meridian-badge">{{ point.meridian }}</p>
          <p class="reveal-hint">{{ revealedMap[index] ? '点击收起' : '点击查看详情' }}</p>
        </div>

        <div v-if="revealedMap[index]" class="acupoint-detail">
          <div class="detail-section">
            <h4 class="detail-label">定位</h4>
            <p class="detail-text">{{ point.location }}</p>
          </div>

          <div class="detail-section">
            <h4 class="detail-label">归经</h4>
            <p class="detail-text">{{ point.meridian }}</p>
          </div>

          <div class="detail-section">
            <h4 class="detail-label">主治</h4>
            <p class="detail-text">{{ point.indication }}</p>
          </div>

          <div v-if="point.technique" class="detail-section">
            <h4 class="detail-label">操作</h4>
            <p class="detail-text">{{ point.technique }}</p>
          </div>

          <div class="detail-tags">
            <TcmTag
              v-for="tag in point.tags"
              :key="tag"
              type="default"
              size="sm"
            >
              {{ tag }}
            </TcmTag>
          </div>
        </div>
      </div>
    </div>

    <TcmEmpty v-if="filteredPoints.length === 0" description="该分类下暂无穴位数据" />

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import AcupointIllustration from '@/components/recite/AcupointIllustration.vue'

const revealedMap = reactive<Record<number, boolean>>({})
const activeMeridian = ref('')
const searchQuery = ref('')
const failedAcuImages = reactive(new Set<string>())
// 图片路径：JPG实拍优先，失败切换SVG定位图
const acuImgExt = reactive<Record<string, string>>({})
function getAcuImageSrc(name: string): string {
  const encoded = encodeURIComponent(name)
  const ext = acuImgExt[name] || '.jpg'
  return `/images/acupoints/${encoded}${ext}`
}
function onAcuImgError(name: string): void {
  if (!acuImgExt[name]) { acuImgExt[name] = '.svg' }  // JPG失败→尝试SVG
  else { failedAcuImages.add(name) }                    // SVG也失败→解剖图兜底
}


interface Acupoint {
  name: string
  code: string
  meridian: string
  region: string
  location: string
  indication: string
  technique?: string
  tags: string[]
}

const acupoints: Acupoint[] = [
  // ==================== 手太阴肺经 (LU) ====================
  {
    name: '中府',
    code: 'LU1',
    meridian: '手太阴肺经',
    region: 'abdomen',
    location: '在胸前壁外上方，前正中线旁开6寸，平第1肋间隙。',
    indication: '咳嗽，气喘，胸满痛，肩背痛。',
    technique: '向外斜刺或平刺0.5-0.8寸。不可向内深刺，以免伤及肺脏。可灸。',
    tags: ['募穴'],
  },
  {
    name: '尺泽',
    code: 'LU5',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在肘横纹中，肱二头肌腱桡侧凹陷处。',
    indication: '咳嗽，气喘，咯血，潮热，咽喉肿痛，肘臂挛痛。',
    technique: '直刺0.8-1.2寸，或点刺出血。可灸。',
    tags: ['合穴'],
  },
  {
    name: '孔最',
    code: 'LU6',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在前臂掌面桡侧，尺泽与太渊连线上，腕横纹上7寸。',
    indication: '咯血，咳嗽，气喘，咽喉肿痛，肘臂挛痛。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['郄穴'],
  },
  {
    name: '列缺',
    code: 'LU7',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在前臂桡侧缘，桡骨茎突上方，腕横纹上1.5寸。当肱桡肌与拇长展肌腱之间。',
    indication: '咳嗽，气喘，咽喉肿痛，头痛，项强，口眼歪斜，齿痛。',
    technique: '向上斜刺0.3-0.5寸。可灸。',
    tags: ['络穴', '八脉交会穴', '四总穴'],
  },
  {
    name: '太渊',
    code: 'LU9',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在腕掌侧横纹桡侧，桡动脉搏动处。',
    indication: '咳嗽，气喘，咯血，无脉症，腕臂痛。',
    technique: '直刺0.3-0.5寸，避开桡动脉。可灸。',
    tags: ['输穴', '原穴', '八会穴（脉会）'],
  },
  {
    name: '鱼际',
    code: 'LU10',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在手拇指本节（第1掌指关节）后凹陷处，约当第1掌骨中点桡侧，赤白肉际处。',
    indication: '咳嗽，咯血，咽喉肿痛，失音，发热。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['荥穴'],
  },
  {
    name: '少商',
    code: 'LU11',
    meridian: '手太阴肺经',
    region: 'hand',
    location: '在手拇指末节桡侧，距指甲角0.1寸。',
    indication: '咽喉肿痛，发热，咳嗽，鼻衄，昏迷，癫狂。',
    technique: '浅刺0.1寸，或点刺出血。可灸。',
    tags: ['井穴'],
  },

  // ==================== 手阳明大肠经 (LI) ====================
  {
    name: '商阳',
    code: 'LI1',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在手食指末节桡侧，距指甲角0.1寸。',
    indication: '齿痛，咽喉肿痛，热病，昏迷。',
    technique: '浅刺0.1寸，或点刺出血。可灸。',
    tags: ['井穴'],
  },
  {
    name: '合谷',
    code: 'LI4',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在手背，第1、2掌骨间，当第二掌骨桡侧的中点处。',
    indication: '头痛、齿痛、目赤肿痛、咽喉肿痛、面瘫、口眼歪斜、热病无汗、多汗、经闭、滞产。',
    technique: '直刺0.5-1寸，可灸。孕妇不宜针刺。',
    tags: ['原穴', '四总穴'],
  },
  {
    name: '阳溪',
    code: 'LI5',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在腕背横纹桡侧，手拇指向上翘起时，当拇短伸肌腱与拇长伸肌腱之间的凹陷中。',
    indication: '头痛，目赤肿痛，齿痛，咽喉肿痛，手腕痛。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['经穴'],
  },
  {
    name: '手三里',
    code: 'LI10',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在前臂背面桡侧，阳溪与曲池连线上，肘横纹下2寸。',
    indication: '上肢不遂，肩臂疼痛，腹痛，腹泻，齿痛。',
    technique: '直刺0.8-1.2寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '曲池',
    code: 'LI11',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在肘横纹外侧端，屈肘时当尺泽与肱骨外上髁连线中点。',
    indication: '热病，咽喉肿痛，齿痛，目赤痛，上肢不遂，腹痛吐泻，高血压，癫狂。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['合穴'],
  },
  {
    name: '肩髃',
    code: 'LI15',
    meridian: '手阳明大肠经',
    region: 'hand',
    location: '在肩部，三角肌上，臂外展或向前平伸时，当肩峰前下方凹陷处。',
    indication: '肩臂疼痛、上肢不遂、瘰疬。',
    technique: '直刺或向下斜刺0.8-1.5寸。可灸。',
    tags: ['交会穴（手阳明与阳蹻脉）'],
  },
  {
    name: '迎香',
    code: 'LI20',
    meridian: '手阳明大肠经',
    region: 'head',
    location: '在鼻翼外缘中点旁，当鼻唇沟中。',
    indication: '鼻塞，鼻衄，鼻渊，口眼歪斜，面痒，胆道蛔虫症。',
    technique: '斜刺或平刺0.3-0.5寸。不宜灸。',
    tags: ['常用穴'],
  },

  // ==================== 足阳明胃经 (ST) ====================
  {
    name: '承泣',
    code: 'ST1',
    meridian: '足阳明胃经',
    region: 'head',
    location: '在面部，瞳孔直下，当眼球与眶下缘之间。',
    indication: '目赤肿痛，流泪，夜盲，眼睑动，口眼歪斜。',
    technique: '以左手拇指向上轻推眼球，紧靠眶缘缓慢直刺0.5-1寸。不宜提插，出针时按压针孔。不宜灸。',
    tags: ['交会穴（足阳明、阳蹻、任脉）'],
  },
  {
    name: '地仓',
    code: 'ST4',
    meridian: '足阳明胃经',
    region: 'head',
    location: '在面部，口角外侧，上直瞳孔。',
    indication: '口眼歪斜，流涎，面痛，齿痛。',
    technique: '斜刺或平刺0.5-1寸，或向颊车方向透刺。可灸。',
    tags: ['交会穴（手阳明、足阳明、阳蹻）'],
  },
  {
    name: '颊车',
    code: 'ST6',
    meridian: '足阳明胃经',
    region: 'head',
    location: '在面颊部，下颌角前上方约一横指（中指），当咀嚼时咬肌隆起，按之凹陷处。',
    indication: '口眼歪斜，齿痛，颊肿，口噤不语。',
    technique: '直刺0.3-0.5寸，或平刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '下关',
    code: 'ST7',
    meridian: '足阳明胃经',
    region: 'head',
    location: '在面部耳前方，当颧弓与下颌切迹所形成的凹陷中。',
    indication: '齿痛，口噤，口眼歪斜，耳聋，耳鸣。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['交会穴（足阳明、足少阳）'],
  },
  {
    name: '头维',
    code: 'ST8',
    meridian: '足阳明胃经',
    region: 'head',
    location: '在头侧部，当额角发际上0.5寸，头正中线旁4.5寸。',
    indication: '头痛，目眩，目赤肿痛，流泪，眼睑动。',
    technique: '平刺0.5-1寸。不宜灸。',
    tags: ['交会穴（足阳明、足少阳、阳维）'],
  },
  {
    name: '梁门',
    code: 'ST21',
    meridian: '足阳明胃经',
    region: 'abdomen',
    location: '在上腹部，当脐中上4寸，前正中线旁开2寸。',
    indication: '胃痛，呕吐，食欲不振，腹胀。',
    technique: '直刺0.8-1.2寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '天枢',
    code: 'ST25',
    meridian: '足阳明胃经',
    region: 'abdomen',
    location: '在腹中部，当脐中旁开2寸。',
    indication: '腹胀肠鸣，绕脐痛，便秘，泄泻，痢疾，月经不调。',
    technique: '直刺1-1.5寸。孕妇不可灸。',
    tags: ['募穴（大肠）'],
  },
  {
    name: '归来',
    code: 'ST29',
    meridian: '足阳明胃经',
    region: 'abdomen',
    location: '在下腹部，当脐中下4寸，前正中线旁开2寸。',
    indication: '月经不调，经闭，痛经，疝气，阴挺。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '梁丘',
    code: 'ST34',
    meridian: '足阳明胃经',
    region: 'leg',
    location: '在大腿前面，当髂前上棘与髌底外侧端的连线上，髌底上2寸。',
    indication: '胃痛，膝肿痛，下肢不遂，乳痈。',
    technique: '直刺1-1.2寸。可灸。',
    tags: ['郄穴'],
  },
  {
    name: '足三里',
    code: 'ST36',
    meridian: '足阳明胃经',
    region: 'leg',
    location: '在小腿外侧，犊鼻下3寸，犊鼻与解溪连线上。',
    indication: '胃痛、呕吐、腹胀、泄泻、便秘、虚劳羸瘦、下肢痿痹、心悸、失眠、癫狂。',
    technique: '直刺1-2寸，可灸。强壮保健要穴。',
    tags: ['合穴', '四总穴', '保健要穴'],
  },
  {
    name: '上巨虚',
    code: 'ST37',
    meridian: '足阳明胃经',
    region: 'leg',
    location: '在小腿外侧，犊鼻下6寸，犊鼻与解溪连线上。',
    indication: '肠鸣腹痛，泄泻，便秘，肠痈，下肢痿痹。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['下合穴（大肠）'],
  },
  {
    name: '丰隆',
    code: 'ST40',
    meridian: '足阳明胃经',
    region: 'leg',
    location: '在小腿外侧，外踝尖上8寸，胫骨前缘外二横指（中指），犊鼻与解溪连线中点。',
    indication: '咳嗽痰多，哮喘，头痛眩晕，癫狂痫，下肢痿痹。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['络穴'],
  },
  {
    name: '内庭',
    code: 'ST44',
    meridian: '足阳明胃经',
    region: 'leg',
    location: '在足背，当第2、3趾间，趾蹼缘后方赤白肉际处。',
    indication: '齿痛，咽喉肿痛，口眼歪斜，鼻衄，热病，胃痛吐酸，足背肿痛。',
    technique: '直刺或斜刺0.5-0.8寸。可灸。',
    tags: ['荥穴'],
  },

  // ==================== 足太阴脾经 (SP) ====================
  {
    name: '隐白',
    code: 'SP1',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在足大趾末节内侧，距趾甲角0.1寸。',
    indication: '崩漏，月经过多，便血，尿血，腹胀，多梦，癫狂。',
    technique: '浅刺0.1寸，或点刺出血。可灸。',
    tags: ['井穴'],
  },
  {
    name: '太白',
    code: 'SP3',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在足内侧缘，当足大趾本节（第1跖趾关节）后下方赤白肉际凹陷处。',
    indication: '胃痛，腹胀，肠鸣，泄泻，便秘，体重节痛。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['输穴', '原穴'],
  },
  {
    name: '公孙',
    code: 'SP4',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在足内侧缘，当第1跖骨基底的前下方赤白肉际凹陷处。',
    indication: '胃痛，呕吐，腹痛，泄泻，心烦失眠，月经不调。',
    technique: '直刺0.6-1.2寸。可灸。',
    tags: ['络穴', '八脉交会穴（通冲脉）'],
  },
  {
    name: '三阴交',
    code: 'SP6',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在小腿内侧，内踝尖上3寸，胫骨内侧缘后方。',
    indication: '月经不调、崩漏、带下、不孕、滞产、遗精、阳痿、遗尿、失眠、眩晕。',
    technique: '直刺1-1.5寸，可灸。孕妇禁针。',
    tags: ['交会穴（足三阴经）', '妇科要穴'],
  },
  {
    name: '阴陵泉',
    code: 'SP9',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在小腿内侧，胫骨内侧髁后下方凹陷处。',
    indication: '腹胀，泄泻，水肿，黄疸，小便不利，膝痛。',
    technique: '直刺1-2寸。可灸。',
    tags: ['合穴'],
  },
  {
    name: '血海',
    code: 'SP10',
    meridian: '足太阴脾经',
    region: 'leg',
    location: '在大腿内侧，髌底内侧端上2寸，当股四头肌内侧头的隆起处。',
    indication: '月经不调，痛经，经闭，崩漏，湿疹，瘾疹，膝股疼痛。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['常用穴'],
  },

  // ==================== 手少阴心经 (HT) ====================
  {
    name: '少海',
    code: 'HT3',
    meridian: '手少阴心经',
    region: 'hand',
    location: '在肘横纹内侧端与肱骨内上髁连线的中点处。屈肘取穴。',
    indication: '心痛，肘臂挛痛，瘰疬，头项痛，腋胁痛。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['合穴'],
  },
  {
    name: '通里',
    code: 'HT5',
    meridian: '手少阴心经',
    region: 'hand',
    location: '在前臂掌侧，当尺侧腕屈肌腱的桡侧缘，腕横纹上1寸。',
    indication: '心悸，怔忡，舌强不语，暴喑，腕臂痛。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['络穴'],
  },
  {
    name: '神门',
    code: 'HT7',
    meridian: '手少阴心经',
    region: 'hand',
    location: '在腕掌侧横纹尺侧端，尺侧腕屈肌腱的桡侧凹陷处。',
    indication: '心痛，心烦，惊悸，失眠，健忘，癫狂痫，胸胁痛。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['输穴', '原穴'],
  },

  // ==================== 手太阳小肠经 (SI) ====================
  {
    name: '少泽',
    code: 'SI1',
    meridian: '手太阳小肠经',
    region: 'hand',
    location: '在手小指末节尺侧，距指甲角0.1寸。',
    indication: '乳痈，乳汁少，头痛，目翳，咽喉肿痛，热病。',
    technique: '浅刺0.1寸，或点刺出血。可灸。',
    tags: ['井穴'],
  },
  {
    name: '后溪',
    code: 'SI3',
    meridian: '手太阳小肠经',
    region: 'hand',
    location: '在手掌尺侧，微握拳，当第5掌指关节后的远侧掌横纹头赤白肉际处。',
    indication: '头项强痛，腰背痛，目赤，耳聋，癫狂痫，手指及肘臂挛痛。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['输穴', '八脉交会穴（通督脉）'],
  },
  {
    name: '天宗',
    code: 'SI11',
    meridian: '手太阳小肠经',
    region: 'back',
    location: '在肩胛部，当冈下窝中央凹陷处，与第4胸椎相平。',
    indication: '肩胛疼痛，气喘，乳痈。',
    technique: '直刺或斜刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '听宫',
    code: 'SI19',
    meridian: '手太阳小肠经',
    region: 'head',
    location: '在面部，耳屏前，下颌骨髁状突的后方，张口时呈凹陷处。',
    indication: '耳鸣，耳聋，聤耳，齿痛，癫狂痫。',
    technique: '张口，直刺0.5-1寸。可灸。',
    tags: ['交会穴（手足少阳、手太阳）'],
  },

  // ==================== 足太阳膀胱经 (BL) ====================
  {
    name: '睛明',
    code: 'BL1',
    meridian: '足太阳膀胱经',
    region: 'head',
    location: '在面部，目内眦角稍上方凹陷处。',
    indication: '目赤肿痛，流泪，目眩，近视，夜盲，色盲。',
    technique: '嘱患者闭目，左手将眼球推向外侧固定，针沿眼眶边缘缓缓刺入0.3-0.5寸。不宜提插捻转。禁灸。',
    tags: ['交会穴（手足太阳、足阳明、阴蹻、阳蹻）'],
  },
  {
    name: '攒竹',
    code: 'BL2',
    meridian: '足太阳膀胱经',
    region: 'head',
    location: '在面部，当眉头陷中，眶上切迹处。',
    indication: '头痛，眉棱骨痛，目赤肿痛，眼睑动，口眼歪斜。',
    technique: '平刺0.3-0.5寸。不宜灸。也可用三棱针点刺出血。',
    tags: ['常用穴'],
  },
  {
    name: '肺俞',
    code: 'BL13',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在背部，当第3胸椎棘突下，旁开1.5寸。',
    indication: '咳嗽，气喘，咯血，骨蒸潮热，盗汗，皮肤瘙痒。',
    technique: '斜刺0.5-0.8寸。可灸。',
    tags: ['背俞穴（肺）'],
  },
  {
    name: '心俞',
    code: 'BL15',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在背部，当第5胸椎棘突下，旁开1.5寸。',
    indication: '心痛，惊悸，失眠，健忘，癫痫，咳嗽，吐血。',
    technique: '斜刺0.5-0.8寸。可灸。',
    tags: ['背俞穴（心）'],
  },
  {
    name: '膈俞',
    code: 'BL17',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在背部，当第7胸椎棘突下，旁开1.5寸。',
    indication: '呕吐，呃逆，气喘，吐血，咳嗽，潮热盗汗。',
    technique: '斜刺0.5-0.8寸。可灸。',
    tags: ['八会穴（血会）'],
  },
  {
    name: '肝俞',
    code: 'BL18',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在背部，当第9胸椎棘突下，旁开1.5寸。',
    indication: '黄疸，胁痛，吐血，目赤，目眩，雀目，癫狂痫，脊背痛。',
    technique: '斜刺0.5-0.8寸。可灸。',
    tags: ['背俞穴（肝）'],
  },
  {
    name: '脾俞',
    code: 'BL20',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在背部，当第11胸椎棘突下，旁开1.5寸。',
    indication: '腹胀，呕吐，泄泻，痢疾，便血，水肿，背痛。',
    technique: '斜刺0.5-0.8寸。可灸。',
    tags: ['背俞穴（脾）'],
  },
  {
    name: '肾俞',
    code: 'BL23',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在腰部，当第2腰椎棘突下，旁开1.5寸。',
    indication: '遗尿，遗精，阳痿，月经不调，白带，水肿，耳鸣，耳聋，腰痛。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['背俞穴（肾）'],
  },
  {
    name: '大肠俞',
    code: 'BL25',
    meridian: '足太阳膀胱经',
    region: 'back',
    location: '在腰部，当第4腰椎棘突下，旁开1.5寸。',
    indication: '腹胀，泄泻，便秘，腰痛。',
    technique: '直刺0.8-1.2寸。可灸。',
    tags: ['背俞穴（大肠）'],
  },
  {
    name: '委中',
    code: 'BL40',
    meridian: '足太阳膀胱经',
    region: 'leg',
    location: '在膝后区，腘横纹中点，当股二头肌腱与半腱肌肌腱的中间。',
    indication: '腰痛，下肢痿痹，腹痛，吐泻，小便不利，遗尿，丹毒。',
    technique: '直刺1-1.5寸，或用三棱针点刺腘静脉出血。可灸。',
    tags: ['合穴', '四总穴'],
  },
  {
    name: '承山',
    code: 'BL57',
    meridian: '足太阳膀胱经',
    region: 'leg',
    location: '在小腿后面正中，委中与昆仑之间，当伸直小腿或足跟上提时腓肠肌肌腹下出现尖角凹陷处。',
    indication: '腰腿拘急疼痛，痔疾，便秘，脚气。',
    technique: '直刺1-2寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '昆仑',
    code: 'BL60',
    meridian: '足太阳膀胱经',
    region: 'leg',
    location: '在足部外踝后方，当外踝尖与跟腱之间的凹陷处。',
    indication: '头痛，项强，目眩，癫痫，难产，腰骶疼痛，足踝肿痛。',
    technique: '直刺0.5-0.8寸。孕妇禁针。可灸。',
    tags: ['经穴'],
  },
  {
    name: '至阴',
    code: 'BL67',
    meridian: '足太阳膀胱经',
    region: 'leg',
    location: '在足小趾末节外侧，距趾甲角0.1寸。',
    indication: '头痛，目痛，鼻塞，鼻衄，胎位不正，难产。',
    technique: '浅刺0.1寸。可灸，治胎位不正用灸法。',
    tags: ['井穴'],
  },

  // ==================== 足少阴肾经 (KI) ====================
  {
    name: '涌泉',
    code: 'KI1',
    meridian: '足少阴肾经',
    region: 'leg',
    location: '在足底部，蜷足时足前部凹陷处，约当足底第2、3趾趾缝纹头端与足跟连线的前1/3与后2/3交点上。',
    indication: '头痛，眩晕，昏厥，癫狂，小儿惊风，失眠，咽喉肿痛，足心热。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['井穴'],
  },
  {
    name: '太溪',
    code: 'KI3',
    meridian: '足少阴肾经',
    region: 'leg',
    location: '在足内侧，内踝后方，当内踝尖与跟腱之间的凹陷处。',
    indication: '月经不调，遗精，阳痿，小便频数，消渴，泄泻，腰痛，耳鸣，失眠，咳血。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['输穴', '原穴'],
  },
  {
    name: '照海',
    code: 'KI6',
    meridian: '足少阴肾经',
    region: 'leg',
    location: '在足内侧，内踝尖下方凹陷处。',
    indication: '月经不调，痛经，带下，阴挺，小便频数，失眠，咽喉干痛，目赤肿痛。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['八脉交会穴（通阴蹻脉）'],
  },
  {
    name: '复溜',
    code: 'KI7',
    meridian: '足少阴肾经',
    region: 'leg',
    location: '在小腿内侧，太溪直上2寸，跟腱的前方。',
    indication: '水肿，腹胀，泄泻，盗汗，热病无汗，下肢痿痹。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['经穴'],
  },

  // ==================== 手厥阴心包经 (PC) ====================
  {
    name: '曲泽',
    code: 'PC3',
    meridian: '手厥阴心包经',
    region: 'hand',
    location: '在肘横纹中，当肱二头肌腱的尺侧缘。',
    indication: '心痛，心悸，胃痛，呕吐，泄泻，热病，肘臂挛痛。',
    technique: '直刺1-1.5寸，或点刺出血。可灸。',
    tags: ['合穴'],
  },
  {
    name: '内关',
    code: 'PC6',
    meridian: '手厥阴心包经',
    region: 'hand',
    location: '在前臂掌侧，腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间。',
    indication: '心痛、心悸、胸闷、胃痛、呕吐、呃逆、失眠、眩晕、肘臂挛痛。',
    technique: '直刺0.5-1寸，可灸。',
    tags: ['络穴', '八脉交会穴（通阴维脉）'],
  },
  {
    name: '大陵',
    code: 'PC7',
    meridian: '手厥阴心包经',
    region: 'hand',
    location: '在腕掌横纹的中点处，当掌长肌腱与桡侧腕屈肌腱之间。',
    indication: '心痛，心悸，胃痛，呕吐，癫狂，疮疡，胸胁痛。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['输穴', '原穴'],
  },
  {
    name: '劳宫',
    code: 'PC8',
    meridian: '手厥阴心包经',
    region: 'hand',
    location: '在手掌心，当第2、3掌骨之间偏于第3掌骨，握拳屈指时中指尖处。',
    indication: '心痛，呕吐，癫狂痫，口疮，口臭。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['荥穴'],
  },

  // ==================== 手少阳三焦经 (TE/SJ) ====================
  {
    name: '外关',
    code: 'TE5',
    meridian: '手少阳三焦经',
    region: 'hand',
    location: '在前臂背侧，当阳池与肘尖的连线上，腕背横纹上2寸，尺骨与桡骨之间。',
    indication: '头痛，目赤肿痛，耳鸣耳聋，胁痛，上肢痿痹，热病。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['络穴', '八脉交会穴（通阳维脉）'],
  },
  {
    name: '支沟',
    code: 'TE6',
    meridian: '手少阳三焦经',
    region: 'hand',
    location: '在前臂背侧，当阳池与肘尖的连线上，腕背横纹上3寸，尺骨与桡骨之间。',
    indication: '便秘，胁痛，耳鸣耳聋，暴喑，瘰疬。',
    technique: '直刺0.5-1寸。可灸。',
    tags: ['经穴'],
  },
  {
    name: '翳风',
    code: 'TE17',
    meridian: '手少阳三焦经',
    region: 'head',
    location: '在耳垂后方，当乳突与下颌角之间的凹陷处。',
    indication: '耳鸣，耳聋，口眼歪斜，面痛，颊肿，瘰疬。',
    technique: '直刺0.8-1.2寸。可灸。',
    tags: ['交会穴（手足少阳）'],
  },

  // ==================== 足少阳胆经 (GB) ====================
  {
    name: '听会',
    code: 'GB2',
    meridian: '足少阳胆经',
    region: 'head',
    location: '在面部，当耳屏间切迹的前方，下颌骨髁状突的后缘，张口有凹陷处。',
    indication: '耳鸣，耳聋，聤耳，齿痛，口眼歪斜。',
    technique: '张口，直刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '阳白',
    code: 'GB14',
    meridian: '足少阳胆经',
    region: 'head',
    location: '在前额部，当瞳孔直上，眉上1寸。',
    indication: '头痛，目眩，目痛，眼睑动，口眼歪斜。',
    technique: '平刺0.3-0.5寸。可灸。',
    tags: ['交会穴（足少阳、阳维）'],
  },
  {
    name: '风池',
    code: 'GB20',
    meridian: '足少阳胆经',
    region: 'head',
    location: '在项部，当枕骨之下，与风府相平，胸锁乳突肌与斜方肌上端之间的凹陷处。',
    indication: '头痛，眩晕，颈项强痛，目赤肿痛，鼻渊，耳鸣，口眼歪斜，感冒，中风。',
    technique: '针尖微下，向鼻尖方向斜刺0.8-1.2寸。可灸。',
    tags: ['交会穴（足少阳、阳维）'],
  },
  {
    name: '肩井',
    code: 'GB21',
    meridian: '足少阳胆经',
    region: 'back',
    location: '在肩上，前直乳中，当大椎与肩峰端连线的中点。',
    indication: '颈项强痛，肩背疼痛，上肢不遂，难产，乳痈，瘰疬。',
    technique: '直刺0.5-0.8寸。不可深刺，孕妇禁针。可灸。',
    tags: ['交会穴（手足少阳、阳维）'],
  },
  {
    name: '环跳',
    code: 'GB30',
    meridian: '足少阳胆经',
    region: 'leg',
    location: '在股外侧部，侧卧屈股，当股骨大转子最凸点与骶管裂孔连线的外1/3与中1/3交点处。',
    indication: '腰胯疼痛，半身不遂，下肢痿痹，遍身风疹。',
    technique: '直刺2-3寸。可灸。',
    tags: ['交会穴（足少阳、足太阳）'],
  },
  {
    name: '阳陵泉',
    code: 'GB34',
    meridian: '足少阳胆经',
    region: 'leg',
    location: '在小腿外侧，当腓骨头前下方凹陷处。',
    indication: '胁痛，口苦，呕吐，黄疸，下肢痿痹，膝髌肿痛，小儿惊风。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['合穴', '下合穴（胆）', '八会穴（筋会）'],
  },
  {
    name: '悬钟',
    code: 'GB39',
    meridian: '足少阳胆经',
    region: 'leg',
    location: '在小腿外侧，当外踝尖上3寸，腓骨前缘。',
    indication: '颈项强痛，偏头痛，胁痛，下肢痿痹，脚气。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['八会穴（髓会）'],
  },
  {
    name: '丘墟',
    code: 'GB40',
    meridian: '足少阳胆经',
    region: 'leg',
    location: '在足外踝的前下方，当趾长伸肌腱的外侧凹陷处。',
    indication: '胸胁胀痛，下肢痿痹，疟疾，外踝肿痛。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['原穴'],
  },
  {
    name: '足临泣',
    code: 'GB41',
    meridian: '足少阳胆经',
    region: 'leg',
    location: '在足背外侧，当足4趾本节（第4跖趾关节）的后方，小趾伸肌腱的外侧凹陷处。',
    indication: '偏头痛，目赤肿痛，胁痛，足跗肿痛，月经不调，乳痈。',
    technique: '直刺0.3-0.5寸。可灸。',
    tags: ['输穴', '八脉交会穴（通带脉）'],
  },

  // ==================== 足厥阴肝经 (LR) ====================
  {
    name: '大敦',
    code: 'LR1',
    meridian: '足厥阴肝经',
    region: 'leg',
    location: '在足大趾末节外侧，距趾甲角0.1寸。',
    indication: '疝气，遗尿，月经不调，经闭，崩漏，阴挺，癫痫。',
    technique: '浅刺0.1寸，或点刺出血。可灸。',
    tags: ['井穴'],
  },
  {
    name: '行间',
    code: 'LR2',
    meridian: '足厥阴肝经',
    region: 'leg',
    location: '在足背侧，当第1、2趾间，趾蹼缘的后方赤白肉际处。',
    indication: '头痛，目眩，目赤肿痛，胁痛，口苦，疝气，小便不利，月经不调，痛经。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['荥穴'],
  },
  {
    name: '太冲',
    code: 'LR3',
    meridian: '足厥阴肝经',
    region: 'leg',
    location: '在足背，第1、2跖骨间，跖骨底结合部前方凹陷中，可触及动脉搏动。',
    indication: '头痛、眩晕、目赤肿痛、胁痛、呃逆、月经不调、痛经、小儿惊风、癫狂痫。',
    technique: '直刺0.5-1寸，可灸。',
    tags: ['输穴', '原穴'],
  },
  {
    name: '期门',
    code: 'LR14',
    meridian: '足厥阴肝经',
    region: 'abdomen',
    location: '在胸部，当乳头直下，第6肋间隙，前正中线旁开4寸。',
    indication: '胸胁胀痛，腹胀，呕吐，乳痈。',
    technique: '斜刺或平刺0.5-0.8寸。可灸。',
    tags: ['募穴（肝）'],
  },

  // ==================== 任脉 (CV) ====================
  {
    name: '中极',
    code: 'CV3',
    meridian: '任脉',
    region: 'abdomen',
    location: '在下腹部，前正中线上，当脐中下4寸。',
    indication: '遗尿，小便不利，癃闭，遗精，阳痿，月经不调，崩漏带下，阴挺，疝气。',
    technique: '直刺1-1.5寸。孕妇禁针。可灸。',
    tags: ['募穴（膀胱）', '交会穴（足三阴、任脉）'],
  },
  {
    name: '关元',
    code: 'CV4',
    meridian: '任脉',
    region: 'abdomen',
    location: '在下腹部，前正中线上，当脐中下3寸。',
    indication: '遗尿，小便频数，癃闭，遗精，阳痿，早泄，月经不调，崩漏带下，不孕，产后恶露不尽，虚劳羸瘦。',
    technique: '直刺1-1.5寸。孕妇禁针。可灸。',
    tags: ['募穴（小肠）', '交会穴（足三阴、任脉）', '保健要穴'],
  },
  {
    name: '气海',
    code: 'CV6',
    meridian: '任脉',
    region: 'abdomen',
    location: '在下腹部，前正中线上，当脐中下1.5寸。',
    indication: '腹痛，泄泻，便秘，遗尿，疝气，遗精，阳痿，月经不调，经闭，虚脱。',
    technique: '直刺1-1.5寸。孕妇慎用。可灸。',
    tags: ['保健要穴'],
  },
  {
    name: '神阙',
    code: 'CV8',
    meridian: '任脉',
    region: 'abdomen',
    location: '在腹中部，脐中央。',
    indication: '腹痛，泄泻，脱肛，水肿，虚脱。',
    technique: '禁针。多用灸法，隔盐灸或艾条灸。',
    tags: ['禁针穴'],
  },
  {
    name: '中脘',
    code: 'CV12',
    meridian: '任脉',
    region: 'abdomen',
    location: '在上腹部，前正中线上，当脐中上4寸。',
    indication: '胃痛，呕吐，吞酸，腹胀，泄泻，黄疸，癫狂。',
    technique: '直刺1-1.5寸。可灸。',
    tags: ['募穴（胃）', '八会穴（腑会）'],
  },
  {
    name: '膻中',
    code: 'CV17',
    meridian: '任脉',
    region: 'abdomen',
    location: '在胸部，前正中线上，平第4肋间隙，两乳头连线的中点。',
    indication: '咳嗽，气喘，胸痛，心悸，乳少，呕吐，噎膈。',
    technique: '平刺0.3-0.5寸。可灸。',
    tags: ['募穴（心包）', '八会穴（气会）'],
  },
  {
    name: '承浆',
    code: 'CV24',
    meridian: '任脉',
    region: 'head',
    location: '在面部，当颏唇沟的正中凹陷处。',
    indication: '口眼歪斜，齿痛，流涎，暴喑，癫狂。',
    technique: '斜刺0.3-0.5寸。可灸。',
    tags: ['交会穴（任脉、足阳明）'],
  },

  // ==================== 督脉 (GV) ====================
  {
    name: '腰阳关',
    code: 'GV3',
    meridian: '督脉',
    region: 'back',
    location: '在腰部，当后正中线上，第4腰椎棘突下凹陷中。',
    indication: '腰骶疼痛，下肢痿痹，月经不调，遗精，阳痿。',
    technique: '向上斜刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '命门',
    code: 'GV4',
    meridian: '督脉',
    region: 'back',
    location: '在腰部，当后正中线上，第2腰椎棘突下凹陷中。',
    indication: '阳痿，遗精，月经不调，痛经，带下，腰脊强痛，泄泻。',
    technique: '向上斜刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '至阳',
    code: 'GV9',
    meridian: '督脉',
    region: 'back',
    location: '在背部，当后正中线上，第7胸椎棘突下凹陷中。',
    indication: '胸胁胀痛，黄疸，咳嗽，气喘，脊强背痛。',
    technique: '向上斜刺0.5-1寸。可灸。',
    tags: ['常用穴'],
  },
  {
    name: '大椎',
    code: 'GV14',
    meridian: '督脉',
    region: 'back',
    location: '在后正中线上，第7颈椎棘突下凹陷中。',
    indication: '热病，疟疾，咳嗽，气喘，骨蒸潮热，癫痫，头痛项强，风疹。',
    technique: '向上斜刺0.5-1寸。可灸。',
    tags: ['交会穴（手足三阳、督脉）'],
  },
  {
    name: '百会',
    code: 'GV20',
    meridian: '督脉',
    region: 'head',
    location: '在头部，前发际正中直上5寸。简易取穴：两耳尖连线中点。',
    indication: '头痛、眩晕、中风失语、癫狂、脱肛、阴挺、不寐。',
    technique: '平刺0.5-0.8寸，可灸。',
    tags: ['交会穴（手足三阳、督脉）'],
  },
  {
    name: '水沟',
    code: 'GV26',
    meridian: '督脉',
    region: 'head',
    location: '在面部，当人中沟的上1/3与下2/3交点处。',
    indication: '昏迷，晕厥，癫狂痫，小儿惊风，口眼歪斜，腰脊强痛。',
    technique: '向上斜刺0.3-0.5寸，或用指甲掐按。不灸。',
    tags: ['交会穴（督脉、手足阳明）', '急救要穴'],
  },

  // ==================== 经外奇穴 ====================
  {
    name: '四神聪',
    code: 'EX-HN1',
    meridian: '经外奇穴',
    region: 'head',
    location: '在头顶部，当百会前后左右各1寸，共4穴。',
    indication: '头痛，眩晕，失眠，健忘，癫痫。',
    technique: '平刺0.5-0.8寸。可灸。',
    tags: ['奇穴'],
  },
  {
    name: '太阳',
    code: 'EX-HN5',
    meridian: '经外奇穴',
    region: 'head',
    location: '在颞部，当眉梢与目外眦之间，向后约一横指的凹陷处。',
    indication: '头痛，目疾，面瘫。',
    technique: '直刺或斜刺0.3-0.5寸，或点刺出血。不宜灸。',
    tags: ['奇穴'],
  },
  {
    name: '定喘',
    code: 'EX-B1',
    meridian: '经外奇穴',
    region: 'back',
    location: '在背部，当第7颈椎棘突下，旁开0.5寸。',
    indication: '咳嗽，气喘，落枕，肩背痛。',
    technique: '直刺0.5-0.8寸。可灸。',
    tags: ['奇穴'],
  },
  {
    name: '夹脊',
    code: 'EX-B2',
    meridian: '经外奇穴',
    region: 'back',
    location: '在背腰部，当第1胸椎至第5腰椎棘突下两侧，后正中线旁开0.5寸，一侧17穴，左右共34穴。',
    indication: '胸1-5夹脊：心肺疾病；胸6-12夹脊：胃肠疾病；腰1-5夹脊：腰腹及下肢疾病。',
    technique: '直刺0.3-0.5寸，或用梅花针叩刺。可灸。',
    tags: ['奇穴'],
  },
  {
    name: '十宣',
    code: 'EX-UE11',
    meridian: '经外奇穴',
    region: 'hand',
    location: '在手十指尖端，距指甲游离缘0.1寸，左右共10穴。',
    indication: '昏迷，高热，中暑，癫痫，癔症，小儿惊风，咽喉肿痛，指端麻木。',
    technique: '直刺0.1-0.2寸，或点刺出血。',
    tags: ['奇穴', '急救穴'],
  },
]

const meridians = computed(() => {
  const mSet = new Set<string>()
  acupoints.forEach(p => mSet.add(p.meridian))
  return Array.from(mSet)
})

const filteredPoints = computed(() => {
  let result = acupoints
  if (activeMeridian.value) {
    result = result.filter(p => p.meridian === activeMeridian.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(p =>
      p.name.includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.indication.includes(q)
    )
  }
  return result
})

function toggleReveal(index: number): void {
  revealedMap[index] = !revealedMap[index]
}
</script>

<style scoped>
.page-acupoints {
  /* 宽度动态填充 */
}

.page-header {
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--tcm-primary-500);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
  display: inline-block;
}

.back-btn:hover {
  color: var(--tcm-primary-700);
}

.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin: 0;
}

/* ===== 搜索栏 ===== */
.search-bar {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-primary);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--tcm-gold-400);
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.1);
}

/* ===== 经络筛选 ===== */
.meridian-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
}

.filter-btn {
  padding: 5px 12px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-xs);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.filter-btn:hover {
  border-color: var(--tcm-gold-300);
}

.filter-btn.is-active {
  border-color: var(--tcm-gold-500);
  background: #FFF8E1;
  color: var(--tcm-gold-600);
  font-weight: 600;
}

/* ===== 穴位卡片网格 ===== */
.acupoints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding-bottom: 40px;
}

.acupoint-card {
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
  overflow: hidden;
  box-shadow: var(--tcm-shadow-sm);
  transition: all var(--tcm-transition-normal);
}

.acupoint-card.is-revealed {
  border-color: var(--tcm-gold-300);
  box-shadow: var(--tcm-shadow-md);
}

.acupoint-front {
  padding: 20px 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: background var(--tcm-transition-fast);
}

.acupoint-front:hover {
  background: var(--tcm-bg-base);
}

/* ===== Illustration area ===== */
.acupoint-front :deep(.acupoint-illustration) {
  margin-bottom: 8px;
}

.point-code {
  font-family: var(--tcm-font-mono);
  font-size: var(--tcm-font-sm);
  font-weight: 600;
  color: var(--tcm-gold-500);
  background: #FFF8E1;
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--tcm-radius-sm);
  margin-bottom: 12px;
}

.point-name {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-2xl);
  color: var(--tcm-text-primary);
  margin: 0 0 6px 0;
}

.point-meridian-badge {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  margin: 0 0 12px 0;
}

.reveal-hint {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
  margin: 0;
}

/* ===== 详情展开 ===== */
.acupoint-detail {
  padding: 0 20px 20px;
  border-top: 1px solid var(--tcm-border-light);
}

.detail-section {
  margin-top: 14px;
}

.detail-label {
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  color: var(--tcm-gold-500);
  margin: 0 0 4px 0;
}

.detail-text {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
  margin: 0;
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
}

@media (max-width: 600px) {
  .acupoints-grid {
    grid-template-columns: 1fr;
  }
}



/* el-image 统一尺寸 */
.acupoint-photo { width: 100%; height: 140px; border-radius: var(--tcm-radius-sm); cursor: pointer; }
</style>
