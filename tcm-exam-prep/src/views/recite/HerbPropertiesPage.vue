<template>
  <div class="page-herbs">
    <div class="page-header">
      <button class="back-btn" @click="$router.push({ name: 'recite-home' })">
        &larr; 返回
      </button>
      <h1 class="page-title">药性背诵</h1>
      <p class="page-subtitle">常用中药性味归经、功效主治，分类记忆更高效</p>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索中药名称或拼音..."
        class="search-input"
      />
    </div>

    <!-- 分类筛选 -->
    <div class="category-filters">
      <button
        :class="['filter-btn', { 'is-active': activeCategory === '' }]"
        @click="activeCategory = ''"
      >
        全部
      </button>
      <button
        v-for="cat in categories"
        :key="cat"
        :class="['filter-btn', { 'is-active': activeCategory === cat }]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- 草药卡片列表 -->
    <div class="herbs-grid">
      <div
        v-for="(herb, index) in filteredHerbs"
        :key="index"
        class="herb-card"
        :class="{ 'is-flipped': flippedMap[index] }"
        @click="toggleFlip(index)"
      >
        <div class="herb-card-inner">
          <!-- 正面：药材图片 + 名称 -->
          <div class="herb-front">
            <!-- 药材图片 — 本地图片优先，加载失败回退到分类图标 -->
            <div class="herb-image-wrap">
              <img
                v-show="!isImageFailed(herb.name)"
                :src="getHerbPhoto(herb.name)"
                :alt="herb.name"
                class="herb-photo"
                loading="lazy"
                @error="onImageError($event, herb)"
              />
              <div v-if="isImageFailed(herb.name)" class="herb-icon-fallback" v-html="getHerbIcon(herb.categories)"></div>
            </div>
            <div class="herb-name-area">
              <span class="herb-pinyin">{{ herb.pinyin }}</span>
              <h3 class="herb-name">{{ herb.name }}</h3>
            </div>
            <div class="herb-front-cats">
              <TcmTag
                v-for="cat in herb.categories"
                :key="cat"
                type="default"
                size="sm"
              >
                {{ cat }}
              </TcmTag>
            </div>
            <p class="herb-front-hint">点击查看药性</p>
          </div>

          <!-- 背面：详细信息 -->
          <div class="herb-back">
            <h3 class="herb-back-name">{{ herb.name }}</h3>

            <div class="herb-property">
              <span class="prop-label">性味</span>
              <span class="prop-value">{{ herb.property }}</span>
            </div>

            <div class="herb-property">
              <span class="prop-label">归经</span>
              <span class="prop-value">{{ herb.meridian }}</span>
            </div>

            <div class="herb-property">
              <span class="prop-label">功效</span>
              <span class="prop-value">{{ herb.effect }}</span>
            </div>

            <div class="herb-property">
              <span class="prop-label">主治</span>
              <span class="prop-value">{{ herb.indication }}</span>
            </div>

            <div class="herb-property">
              <span class="prop-label">用法用量</span>
              <span class="prop-value">{{ herb.dosage }}</span>
            </div>

            <div v-if="herb.caution" class="herb-property">
              <span class="prop-label">使用注意</span>
              <span class="prop-value prop-caution">{{ herb.caution }}</span>
            </div>

            <div class="herb-back-cats">
              <TcmTag
                v-for="cat in herb.categories"
                :key="cat"
                type="key"
                size="sm"
              >
                {{ cat }}
              </TcmTag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TcmEmpty v-if="filteredHerbs.length === 0" description="该分类下暂无草药数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import TcmTag from '@/components/ui/TcmTag.vue'
import TcmEmpty from '@/components/ui/TcmEmpty.vue'
import { getHerbImageUrl } from '@/data/herbImages'

const activeCategory = ref('')
const searchQuery = ref('')
const flippedMap = reactive<Record<number, boolean>>({})

interface Herb {
  name: string
  pinyin: string
  property: string
  meridian: string
  effect: string
  indication: string
  dosage: string
  caution?: string
  categories: string[]
}

const herbs: Herb[] = [
  // ==================== 解表药 (15) ====================
  {
    name: '麻黄',
    pinyin: 'má huáng',
    property: '辛、微苦，温',
    meridian: '肺、膀胱经',
    effect: '发汗解表，宣肺平喘，利水消肿',
    indication: '风寒感冒，胸闷喘咳，风水浮肿。',
    dosage: '2-10g，煎服。发汗解表宜生用，止咳平喘多蜜炙。',
    caution: '表虚自汗、阴虚盗汗及肺肾虚喘者慎用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '桂枝',
    pinyin: 'guì zhī',
    property: '辛、甘，温',
    meridian: '心、肺、膀胱经',
    effect: '发汗解肌，温通经脉，助阳化气',
    indication: '风寒感冒，脘腹冷痛，血寒经闭，关节痹痛，水肿，心悸。',
    dosage: '3-10g，煎服。',
    caution: '凡外感热病、阴虚火旺、血热妄行者忌用。孕妇及月经过多者慎用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '紫苏',
    pinyin: 'zǐ sū',
    property: '辛，温',
    meridian: '肺、脾经',
    effect: '解表散寒，行气和胃，解鱼蟹毒',
    indication: '风寒感冒，咳嗽呕恶，妊娠呕吐，鱼蟹中毒。',
    dosage: '5-10g，煎服。解表宜后下。',
    caution: '气虚多汗者不宜多用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '生姜',
    pinyin: 'shēng jiāng',
    property: '辛，微温',
    meridian: '肺、脾、胃经',
    effect: '解表散寒，温中止呕，化痰止咳，解鱼蟹毒',
    indication: '风寒感冒，胃寒呕吐，寒痰咳嗽，鱼蟹中毒。',
    dosage: '3-10g，煎服。或捣汁服。',
    caution: '热盛及阴虚内热者忌用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '荆芥',
    pinyin: 'jīng jiè',
    property: '辛，微温',
    meridian: '肺、肝经',
    effect: '解表散风，透疹消疮，止血',
    indication: '外感表证，麻疹不透，风疹瘙痒，疮疡初起，吐血衄血便血。',
    dosage: '5-10g，煎服。解表宜后下，止血宜炒炭。',
    caution: '表虚自汗、阴虚头痛者忌用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '防风',
    pinyin: 'fáng fēng',
    property: '辛、甘，微温',
    meridian: '膀胱、肝、脾经',
    effect: '祛风解表，胜湿止痛，止痉',
    indication: '外感表证，风疹瘙痒，风湿痹痛，破伤风。',
    dosage: '5-10g，煎服。',
    caution: '阴虚火旺、血虚发痉者慎用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '羌活',
    pinyin: 'qiāng huó',
    property: '辛、苦，温',
    meridian: '膀胱、肾经',
    effect: '解表散寒，祛风胜湿，止痛',
    indication: '风寒感冒，头痛项强，风寒湿痹，肩背酸痛。',
    dosage: '3-10g，煎服。',
    caution: '血虚痹痛、阴虚外感者慎用。用量过大易致呕吐。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '白芷',
    pinyin: 'bái zhǐ',
    property: '辛，温',
    meridian: '肺、胃、大肠经',
    effect: '解表散寒，祛风止痛，通鼻窍，燥湿止带，消肿排脓',
    indication: '风寒感冒，头痛牙痛，鼻渊鼻塞，带下，疮疡肿痛。',
    dosage: '3-10g，煎服。外用适量。',
    caution: '阴虚血热者忌用。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '细辛',
    pinyin: 'xì xīn',
    property: '辛，温。有小毒',
    meridian: '心、肺、肾经',
    effect: '解表散寒，祛风止痛，通鼻窍，温肺化饮',
    indication: '风寒感冒，头痛牙痛，鼻渊鼻塞，风湿痹痛，痰饮喘咳。',
    dosage: '1-3g，煎服。外用适量。',
    caution: '不宜与藜芦同用。阴虚阳亢头痛、肺燥咳嗽者忌用。用量不宜过大。',
    categories: ['解表药', '辛温解表'],
  },
  {
    name: '薄荷',
    pinyin: 'bò he',
    property: '辛，凉',
    meridian: '肺、肝经',
    effect: '疏散风热，清利头目，利咽透疹，疏肝行气',
    indication: '风热感冒，头痛目赤，咽喉肿痛，麻疹不透，风疹瘙痒，肝郁胁痛。',
    dosage: '3-6g，煎服。宜后下。',
    caution: '表虚汗多者忌用。',
    categories: ['解表药', '辛凉解表'],
  },
  {
    name: '牛蒡子',
    pinyin: 'niú bàng zǐ',
    property: '辛、苦，寒',
    meridian: '肺、胃经',
    effect: '疏散风热，宣肺祛痰，利咽透疹，解毒消肿',
    indication: '风热感冒，咳嗽痰多，咽喉肿痛，麻疹不透，风热疹痒，痈肿疮毒。',
    dosage: '6-12g，煎服。炒用可减其苦寒滑利之性。',
    caution: '气虚便溏者慎用。',
    categories: ['解表药', '辛凉解表'],
  },
  {
    name: '蝉蜕',
    pinyin: 'chán tuì',
    property: '甘，寒',
    meridian: '肺、肝经',
    effect: '疏散风热，利咽开音，透疹止痒，明目退翳，息风止痉',
    indication: '风热感冒，咽痛音哑，麻疹不透，风疹瘙痒，目赤翳障，小儿惊风。',
    dosage: '3-6g，煎服。或入丸散。',
    caution: '孕妇慎用。',
    categories: ['解表药', '辛凉解表'],
  },
  {
    name: '桑叶',
    pinyin: 'sāng yè',
    property: '甘、苦，寒',
    meridian: '肺、肝经',
    effect: '疏散风热，清肺润燥，清肝明目',
    indication: '风热感冒，咳嗽咽痛，肺燥干咳，肝阳上亢之头晕头痛，目赤昏花。',
    dosage: '5-10g，煎服。或入丸散。外用煎水洗眼。',
    caution: '风寒感冒者忌用。',
    categories: ['解表药', '辛凉解表'],
  },
  {
    name: '菊花',
    pinyin: 'jú huā',
    property: '辛、甘、苦，微寒',
    meridian: '肺、肝经',
    effect: '疏散风热，平抑肝阳，清肝明目，清热解毒',
    indication: '风热感冒，头痛眩晕，目赤肿痛，眼目昏花，疮痈肿毒。',
    dosage: '5-10g，煎服。或泡茶饮。',
    caution: '气虚胃寒者慎用。',
    categories: ['解表药', '辛凉解表'],
  },
  {
    name: '柴胡',
    pinyin: 'chái hú',
    property: '苦、辛，微寒',
    meridian: '肝、胆经',
    effect: '疏散退热，疏肝解郁，升举阳气',
    indication: '感冒发热，寒热往来，胸胁胀痛，月经不调，子宫脱垂，脱肛。',
    dosage: '3-10g，煎服。解表退热宜生用，疏肝解郁宜醋炙。',
    caution: '肝阳上亢、肝风内动、阴虚火旺者忌用。',
    categories: ['解表药', '辛凉解表'],
  },

  // ==================== 清热药 (20) ====================
  {
    name: '石膏',
    pinyin: 'shí gāo',
    property: '辛、甘，大寒',
    meridian: '肺、胃经',
    effect: '清热泻火，除烦止渴，煅用收湿生肌敛疮',
    indication: '气分实热证，壮热烦渴，肺热咳喘，胃火牙痛，煅用治疮疡不敛、湿疹。',
    dosage: '15-60g，先煎。煅石膏外用适量。',
    caution: '脾胃虚寒及阴虚内热者忌用。',
    categories: ['清热药', '清热泻火'],
  },
  {
    name: '知母',
    pinyin: 'zhī mǔ',
    property: '苦、甘，寒',
    meridian: '肺、胃、肾经',
    effect: '清热泻火，滋阴润燥',
    indication: '气分实热证，肺热燥咳，骨蒸潮热，消渴，肠燥便秘。',
    dosage: '6-12g，煎服。',
    caution: '脾虚便溏者慎用。',
    categories: ['清热药', '清热泻火'],
  },
  {
    name: '栀子',
    pinyin: 'zhī zǐ',
    property: '苦，寒',
    meridian: '心、肺、三焦经',
    effect: '泻火除烦，清热利湿，凉血解毒，消肿止痛',
    indication: '热病心烦，湿热黄疸，血热吐衄，目赤肿痛，疮疡肿毒，跌打损伤。',
    dosage: '6-10g，煎服。外用适量。生用清热泻火，炒焦凉血止血。',
    caution: '脾虚便溏者慎用。',
    categories: ['清热药', '清热泻火'],
  },
  {
    name: '夏枯草',
    pinyin: 'xià kū cǎo',
    property: '辛、苦，寒',
    meridian: '肝、胆经',
    effect: '清肝明目，散结消肿',
    indication: '目赤肿痛，头痛眩晕，瘰疬瘿瘤，乳痈肿痛。',
    dosage: '9-15g，煎服。或熬膏服。',
    caution: '脾胃虚弱者慎用。',
    categories: ['清热药', '清热泻火'],
  },
  {
    name: '黄芩',
    pinyin: 'huáng qín',
    property: '苦，寒',
    meridian: '肺、胆、脾、大肠、小肠经',
    effect: '清热燥湿，泻火解毒，止血，安胎',
    indication: '湿温暑湿，湿热痞满，泻痢黄疸，肺热咳嗽，血热吐衄，痈肿疮毒，胎动不安。',
    dosage: '3-10g，煎服。清热生用，安胎炒用，止血炒炭。',
    caution: '脾胃虚寒者忌用。',
    categories: ['清热药', '清热燥湿'],
  },
  {
    name: '黄连',
    pinyin: 'huáng lián',
    property: '苦，寒',
    meridian: '心、脾、胃、肝、胆、大肠经',
    effect: '清热燥湿，泻火解毒',
    indication: '湿热痞满，呕吐吞酸，泻痢，黄疸，高热神昏，心火亢盛，心烦不寐，痈肿疔疮。',
    dosage: '2-5g，煎服。外用适量。',
    caution: '脾胃虚寒者忌用。大苦大寒，不宜久服。',
    categories: ['清热药', '清热燥湿'],
  },
  {
    name: '黄柏',
    pinyin: 'huáng bǎi',
    property: '苦，寒',
    meridian: '肾、膀胱经',
    effect: '清热燥湿，泻火除蒸，解毒疗疮',
    indication: '湿热泻痢，黄疸尿赤，带下阴痒，骨蒸潮热，盗汗遗精，疮疡肿毒，湿热下注之足膝肿痛。',
    dosage: '3-12g，煎服。外用适量。',
    caution: '脾胃虚寒者忌用。',
    categories: ['清热药', '清热燥湿'],
  },
  {
    name: '金银花',
    pinyin: 'jīn yín huā',
    property: '甘，寒',
    meridian: '肺、心、胃经',
    effect: '清热解毒，疏散风热',
    indication: '痈肿疔疮，喉痹丹毒，风热感冒，温病发热，热毒血痢。',
    dosage: '6-15g，煎服。',
    caution: '脾胃虚寒及气虚疮疡脓清者忌用。',
    categories: ['清热药', '清热解毒'],
  },
  {
    name: '连翘',
    pinyin: 'lián qiào',
    property: '苦，微寒',
    meridian: '肺、心、小肠经',
    effect: '清热解毒，消肿散结，疏散风热',
    indication: '痈疽瘰疬，乳痈丹毒，风热感冒，温病发热，热淋涩痛。',
    dosage: '6-15g，煎服。',
    caution: '脾胃虚寒及气虚疮疡脓清者不宜用。',
    categories: ['清热药', '清热解毒'],
  },
  {
    name: '板蓝根',
    pinyin: 'bǎn lán gēn',
    property: '苦，寒',
    meridian: '心、胃经',
    effect: '清热解毒，凉血利咽',
    indication: '温病发热，痄腮喉痹，丹毒，痈肿疮毒。',
    dosage: '9-15g，煎服。',
    caution: '脾胃虚寒者忌用。体虚无实火热毒者忌用。',
    categories: ['清热药', '清热解毒'],
  },
  {
    name: '蒲公英',
    pinyin: 'pú gōng yīng',
    property: '苦、甘，寒',
    meridian: '肝、胃经',
    effect: '清热解毒，消肿散结，利尿通淋',
    indication: '乳痈肿痛，痈肿疔毒，咽喉肿痛，湿热黄疸，热淋涩痛。',
    dosage: '10-15g，煎服。外用适量。',
    caution: '用量过大可致缓泻。',
    categories: ['清热药', '清热解毒'],
  },
  {
    name: '鱼腥草',
    pinyin: 'yú xīng cǎo',
    property: '辛，微寒',
    meridian: '肺经',
    effect: '清热解毒，消痈排脓，利尿通淋',
    indication: '肺痈吐脓，痰热喘咳，热痢，热淋，痈肿疮毒。',
    dosage: '15-25g，不宜久煎。鲜品用量加倍。外用适量。',
    caution: '虚寒证者忌用。',
    categories: ['清热药', '清热解毒'],
  },
  {
    name: '生地黄',
    pinyin: 'shēng dì huáng',
    property: '甘，寒',
    meridian: '心、肝、肾经',
    effect: '清热凉血，养阴生津',
    indication: '热入营血，舌绛烦渴，斑疹吐衄，阴虚内热，骨蒸潮热，津伤口渴，肠燥便秘。',
    dosage: '10-15g，煎服。鲜品用量加倍。',
    caution: '脾虚湿滞、腹满便溏者忌用。',
    categories: ['清热药', '清热凉血'],
  },
  {
    name: '玄参',
    pinyin: 'xuán shēn',
    property: '甘、苦、咸，微寒',
    meridian: '肺、胃、肾经',
    effect: '清热凉血，滋阴降火，解毒散结',
    indication: '热入营血，温毒发斑，咽喉肿痛，瘰疬痰核，痈肿疮毒。',
    dosage: '9-15g，煎服。',
    caution: '不宜与藜芦同用。脾虚便溏者慎用。',
    categories: ['清热药', '清热凉血'],
  },
  {
    name: '牡丹皮',
    pinyin: 'mǔ dān pí',
    property: '苦、辛，微寒',
    meridian: '心、肝、肾经',
    effect: '清热凉血，活血化瘀',
    indication: '热入营血，斑疹吐衄，阴虚骨蒸，血瘀经闭痛经，痈肿疮毒，跌打损伤。',
    dosage: '6-12g，煎服。清热凉血宜生用，活血化瘀宜酒炙。',
    caution: '血虚有寒、月经过多及孕妇不宜用。',
    categories: ['清热药', '清热凉血'],
  },
  {
    name: '赤芍',
    pinyin: 'chì sháo',
    property: '苦，微寒',
    meridian: '肝经',
    effect: '清热凉血，散瘀止痛',
    indication: '热入营血，斑疹吐衄，经闭癥瘕，跌打损伤，痈肿疮毒，目赤肿痛。',
    dosage: '6-12g，煎服。',
    caution: '不宜与藜芦同用。血虚经闭者慎用。',
    categories: ['清热药', '清热凉血'],
  },
  {
    name: '青蒿',
    pinyin: 'qīng hāo',
    property: '苦、辛，寒',
    meridian: '肝、胆、肾经',
    effect: '清虚热，截疟，解暑热',
    indication: '温邪伤阴之夜热早凉，阴虚骨蒸潮热，疟疾寒热，暑热外感。',
    dosage: '6-12g，煎服。不宜久煎。或鲜品绞汁服。',
    caution: '脾胃虚弱、肠滑泄泻者忌用。',
    categories: ['清热药', '清虚热'],
  },
  {
    name: '地骨皮',
    pinyin: 'dì gǔ pí',
    property: '甘，寒',
    meridian: '肺、肝、肾经',
    effect: '凉血除蒸，清肺泻火',
    indication: '阴虚潮热骨蒸，盗汗，肺热咳嗽，血热吐衄。',
    dosage: '9-15g，煎服。',
    caution: '外感风寒发热及脾虚便溏者不宜用。',
    categories: ['清热药', '清虚热'],
  },

  // ==================== 泻下药 (5) ====================
  {
    name: '大黄',
    pinyin: 'dà huáng',
    property: '苦，寒',
    meridian: '脾、胃、大肠、肝、心包经',
    effect: '泻下攻积，清热泻火，凉血解毒，逐瘀通经',
    indication: '实热便秘，积滞腹痛，血热吐衄，目赤咽肿，痈肿疔疮，湿热黄疸，瘀血经闭，跌打损伤。',
    dosage: '3-15g，煎服。攻下宜后下，酒制活血，炒炭止血。',
    caution: '孕妇及月经期、哺乳期慎用。脾胃虚寒者忌用。',
    categories: ['泻下药', '攻下药'],
  },
  {
    name: '芒硝',
    pinyin: 'máng xiāo',
    property: '咸、苦，寒',
    meridian: '胃、大肠经',
    effect: '泻下攻积，润燥软坚，清热消肿',
    indication: '实热便秘，积滞腹痛，肠痈肿痛，咽痛口疮，目赤肿痛。',
    dosage: '6-12g，溶化服。外用适量。',
    caution: '孕妇及哺乳期慎用。不宜与硫黄同用。',
    categories: ['泻下药', '攻下药'],
  },
  {
    name: '火麻仁',
    pinyin: 'huǒ má rén',
    property: '甘，平',
    meridian: '脾、胃、大肠经',
    effect: '润肠通便，滋养补虚',
    indication: '老人、产妇及体虚津血不足之肠燥便秘。',
    dosage: '10-15g，打碎煎服。',
    caution: '食入过量可致中毒（2-60g可引起中毒）。',
    categories: ['泻下药', '润下药'],
  },
  {
    name: '甘遂',
    pinyin: 'gān suì',
    property: '苦，寒。有毒',
    meridian: '肺、肾、大肠经',
    effect: '泻水逐饮，消肿散结',
    indication: '水肿胀满，胸腹积水，痰饮积聚，风痰癫痫，痈肿疮毒。',
    dosage: '0.5-1.5g，入丸散服。醋制减毒。外用适量。',
    caution: '不宜与甘草同用。孕妇禁用。体虚者忌用。',
    categories: ['泻下药', '峻下逐水药'],
  },
  {
    name: '巴豆',
    pinyin: 'bā dòu',
    property: '辛，热。有大毒',
    meridian: '胃、大肠经',
    effect: '峻下冷积，逐水退肿，祛痰利咽，蚀疮去腐',
    indication: '寒积便秘，腹水鼓胀，喉痹痰阻，痈肿脓成不溃，疥癣恶疮。',
    dosage: '0.1-0.3g，入丸散服。多用巴豆霜。外用适量。',
    caution: '不宜与牵牛子同用。孕妇及体弱者忌用。',
    categories: ['泻下药', '峻下逐水药'],
  },

  // ==================== 祛风湿药 (8) ====================
  {
    name: '独活',
    pinyin: 'dú huó',
    property: '辛、苦，温',
    meridian: '肾、膀胱经',
    effect: '祛风湿，通痹止痛，解表',
    indication: '风寒湿痹，腰膝疼痛，外感风寒夹湿之头痛身重。',
    dosage: '3-10g，煎服。',
    caution: '阴虚血燥者慎用。',
    categories: ['祛风湿药', '祛风湿散寒药'],
  },
  {
    name: '威灵仙',
    pinyin: 'wēi líng xiān',
    property: '辛、咸，温',
    meridian: '膀胱经',
    effect: '祛风湿，通经络，消骨鲠',
    indication: '风湿痹痛，肢体麻木，筋脉拘挛，骨鲠咽喉。',
    dosage: '6-10g，煎服。外用适量。',
    caution: '气血虚弱者慎用。服时忌茶。',
    categories: ['祛风湿药', '祛风湿散寒药'],
  },
  {
    name: '秦艽',
    pinyin: 'qín jiāo',
    property: '苦、辛，平',
    meridian: '胃、肝、胆经',
    effect: '祛风湿，舒筋络，退虚热，清湿热',
    indication: '风湿痹痛，筋脉拘挛，骨蒸潮热，湿热黄疸。',
    dosage: '3-10g，煎服。',
    caution: '腹痛便溏者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '防己',
    pinyin: 'fáng jǐ',
    property: '苦，寒',
    meridian: '膀胱、肺、脾经',
    effect: '祛风湿，止痛，利水消肿',
    indication: '风湿痹痛，水肿脚气，小便不利。',
    dosage: '5-10g，煎服。',
    caution: '大苦大寒，脾胃虚寒者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '桑寄生',
    pinyin: 'sāng jì shēng',
    property: '苦、甘，平',
    meridian: '肝、肾经',
    effect: '祛风湿，补肝肾，强筋骨，安胎元',
    indication: '风湿痹痛，腰膝酸软，胎动不安，崩漏下血。',
    dosage: '9-15g，煎服。',
    caution: '无特殊禁忌。',
    categories: ['祛风湿药', '祛风湿强筋骨药'],
  },
  {
    name: '五加皮',
    pinyin: 'wǔ jiā pí',
    property: '辛、苦，温',
    meridian: '肝、肾经',
    effect: '祛风湿，补肝肾，强筋骨，利水消肿',
    indication: '风湿痹痛，筋骨痿软，水肿脚气。',
    dosage: '5-10g，煎服。或浸酒服。',
    caution: '阴虚火旺者慎用。',
    categories: ['祛风湿药', '祛风湿强筋骨药'],
  },
  {
    name: '木瓜',
    pinyin: 'mù guā',
    property: '酸，温',
    meridian: '肝、脾经',
    effect: '舒筋活络，和胃化湿',
    indication: '风湿痹痛，筋脉拘挛，脚气肿痛，暑湿吐泻。',
    dosage: '6-10g，煎服。',
    caution: '胃酸过多者不宜用。内有郁热者忌用。',
    categories: ['祛风湿药', '祛风湿散寒药'],
  },
  {
    name: '蕲蛇',
    pinyin: 'qí shé',
    property: '甘、咸，温。有毒',
    meridian: '肝经',
    effect: '祛风通络，定惊止痉',
    indication: '风湿顽痹，中风半身不遂，小儿惊风，破伤风，麻风，疥癣。',
    dosage: '3-9g，研末吞服1-1.5g。',
    caution: '阴虚血燥者慎用。',
    categories: ['祛风湿药', '祛风湿散寒药'],
  },

  // ==================== 化湿药 (5) ====================
  {
    name: '藿香',
    pinyin: 'huò xiāng',
    property: '辛，微温',
    meridian: '脾、胃、肺经',
    effect: '芳香化湿，和中止呕，发表解暑',
    indication: '湿浊中阻之脘痞呕吐，暑湿倦怠，寒湿闭暑，腹痛吐泻，鼻渊头痛。',
    dosage: '5-10g，煎服。鲜品加倍。不宜久煎。',
    caution: '阴虚血燥者不宜用。',
    categories: ['化湿药'],
  },
  {
    name: '佩兰',
    pinyin: 'pèi lán',
    property: '辛，平',
    meridian: '脾、胃、肺经',
    effect: '芳香化湿，醒脾开胃，发表解暑',
    indication: '湿浊中阻之脘痞呕恶，口中甜腻，口臭多涎，暑湿表证。',
    dosage: '5-10g，煎服。不宜久煎。',
    caution: '阴虚血燥、气虚者慎用。',
    categories: ['化湿药'],
  },
  {
    name: '苍术',
    pinyin: 'cāng zhú',
    property: '辛、苦，温',
    meridian: '脾、胃、肝经',
    effect: '燥湿健脾，祛风散寒，明目',
    indication: '湿阻中焦之脘腹胀满，泄泻，水肿，风寒湿痹，风寒感冒，雀目夜盲。',
    dosage: '5-10g，煎服。',
    caution: '阴虚内热、气虚多汗者忌用。',
    categories: ['化湿药'],
  },
  {
    name: '厚朴',
    pinyin: 'hòu pò',
    property: '苦、辛，温',
    meridian: '脾、胃、肺、大肠经',
    effect: '燥湿行气，消积除满，降逆平喘',
    indication: '湿阻中焦之脘腹胀满，食积气滞，腹胀便秘，痰饮喘咳。',
    dosage: '3-10g，煎服。',
    caution: '孕妇慎用。',
    categories: ['化湿药'],
  },
  {
    name: '砂仁',
    pinyin: 'shā rén',
    property: '辛，温',
    meridian: '脾、胃、肾经',
    effect: '化湿开胃，温脾止泻，理气安胎',
    indication: '湿浊中阻之脘痞不饥，脾胃虚寒之呕吐泄泻，妊娠恶阻，胎动不安。',
    dosage: '3-6g，煎服。宜后下。',
    caution: '阴虚血燥者慎用。',
    categories: ['化湿药'],
  },

  // ==================== 利水渗湿药 (8) ====================
  {
    name: '茯苓',
    pinyin: 'fú líng',
    property: '甘、淡，平',
    meridian: '心、肺、脾、肾经',
    effect: '利水渗湿，健脾宁心',
    indication: '水肿尿少，痰饮眩悸，脾虚食少，便溏泄泻，心神不安，惊悸失眠。',
    dosage: '10-15g，煎服。',
    caution: '虚寒精滑者忌用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '泽泻',
    pinyin: 'zé xiè',
    property: '甘，寒',
    meridian: '肾、膀胱经',
    effect: '利水渗湿，泄热通淋，化浊降脂',
    indication: '水肿胀满，小便不利，热淋涩痛，高脂血症。',
    dosage: '6-10g，煎服。',
    caution: '无湿热及肾虚精滑者忌用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '薏苡仁',
    pinyin: 'yì yǐ rén',
    property: '甘、淡，凉',
    meridian: '脾、胃、肺经',
    effect: '利水渗湿，健脾止泻，除痹排脓，解毒散结',
    indication: '水肿脚气，小便不利，脾虚泄泻，湿痹拘挛，肺痈肠痈，赘疣癌肿。',
    dosage: '9-30g，煎服。健脾炒用，其余生用。',
    caution: '孕妇慎用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '车前子',
    pinyin: 'chē qián zǐ',
    property: '甘，寒',
    meridian: '肝、肾、肺、小肠经',
    effect: '清热利尿通淋，渗湿止泻，清肝明目，清肺化痰',
    indication: '热淋涩痛，水肿胀满，暑湿泄泻，目赤肿痛，痰热咳嗽。',
    dosage: '9-15g，包煎。',
    caution: '肾虚精滑及孕妇慎用。',
    categories: ['利水渗湿药', '利尿通淋药'],
  },
  {
    name: '滑石',
    pinyin: 'huá shí',
    property: '甘、淡，寒',
    meridian: '膀胱、肺、胃经',
    effect: '利尿通淋，清热解暑，外用收湿敛疮',
    indication: '热淋石淋，暑湿烦渴，湿温初起，外用治湿疹湿疮。',
    dosage: '10-20g，包煎。外用适量。',
    caution: '脾虚及热病津伤者慎用。',
    categories: ['利水渗湿药', '利尿通淋药'],
  },
  {
    name: '木通',
    pinyin: 'mù tōng',
    property: '苦，寒',
    meridian: '心、小肠、膀胱经',
    effect: '利尿通淋，清心除烦，通经下乳',
    indication: '热淋涩痛，水肿脚气，心烦尿赤，口舌生疮，经闭乳少，湿热痹痛。',
    dosage: '3-6g，煎服。',
    caution: '孕妇及肾功能不全者忌用。不宜过量久服。',
    categories: ['利水渗湿药', '利尿通淋药'],
  },
  {
    name: '茵陈',
    pinyin: 'yīn chén',
    property: '苦，微寒',
    meridian: '脾、胃、肝、胆经',
    effect: '清热利湿，利胆退黄',
    indication: '黄疸尿少，湿温暑湿，湿疮瘙痒。',
    dosage: '6-15g，煎服。外用适量。',
    caution: '血虚萎黄者慎用。',
    categories: ['利水渗湿药', '利湿退黄药'],
  },
  {
    name: '金钱草',
    pinyin: 'jīn qián cǎo',
    property: '甘、咸，微寒',
    meridian: '肝、胆、肾、膀胱经',
    effect: '利湿退黄，利尿通淋，解毒消肿',
    indication: '湿热黄疸，石淋热淋，痈肿疔疮，毒蛇咬伤。',
    dosage: '15-30g，鲜品加倍。煎服。',
    caution: '脾胃虚寒者慎用。',
    categories: ['利水渗湿药', '利湿退黄药'],
  },

  // ==================== 温里药 (5) ====================
  {
    name: '附子',
    pinyin: 'fù zǐ',
    property: '辛、甘，大热。有毒',
    meridian: '心、肾、脾经',
    effect: '回阳救逆，补火助阳，散寒止痛',
    indication: '亡阳虚脱，肢冷脉微，阳痿宫冷，心腹冷痛，虚寒吐泻，阴寒水肿，阳虚外感。',
    dosage: '3-15g，先煎。口尝无麻舌感为度。',
    caution: '不宜与半夏、瓜蒌、贝母、白及、白蔹同用。孕妇禁用。阴虚阳亢者忌用。',
    categories: ['温里药'],
  },
  {
    name: '干姜',
    pinyin: 'gān jiāng',
    property: '辛，热',
    meridian: '脾、胃、肾、心、肺经',
    effect: '温中散寒，回阳通脉，温肺化饮',
    indication: '脾胃虚寒之脘腹冷痛、呕吐泄泻，亡阳虚脱，寒饮喘咳。',
    dosage: '3-10g，煎服。',
    caution: '阴虚内热、血热妄行者忌用。孕妇慎用。',
    categories: ['温里药'],
  },
  {
    name: '肉桂',
    pinyin: 'ròu guì',
    property: '辛、甘，大热',
    meridian: '肾、脾、心、肝经',
    effect: '补火助阳，引火归元，散寒止痛，温通经脉',
    indication: '阳痿宫冷，腰膝冷痛，肾虚作喘，虚阳上浮，心腹冷痛，寒疝腹痛，经闭痛经。',
    dosage: '1-5g，煎服。宜后下或研末冲服。',
    caution: '不宜与赤石脂同用。阴虚火旺、里有实热及孕妇忌用。',
    categories: ['温里药'],
  },
  {
    name: '吴茱萸',
    pinyin: 'wú zhū yú',
    property: '辛、苦，热。有小毒',
    meridian: '肝、脾、胃、肾经',
    effect: '散寒止痛，降逆止呕，助阳止泻',
    indication: '厥阴头痛，寒疝腹痛，寒湿脚气，脘腹胀痛，呕吐吞酸，五更泄泻。',
    dosage: '2-5g，煎服。外用适量。',
    caution: '不宜大量久服。阴虚有热者忌用。',
    categories: ['温里药'],
  },
  {
    name: '丁香',
    pinyin: 'dīng xiāng',
    property: '辛，温',
    meridian: '脾、胃、肾经',
    effect: '温中降逆，散寒止痛，温肾助阳',
    indication: '胃寒呕吐呃逆，脘腹冷痛，阳痿宫冷。',
    dosage: '1-3g，煎服。或研末外敷。',
    caution: '不宜与郁金同用。热证呕吐及阴虚内热者忌用。',
    categories: ['温里药'],
  },

  // ==================== 理气药 (6) ====================
  {
    name: '陈皮',
    pinyin: 'chén pí',
    property: '辛、苦，温',
    meridian: '脾、肺经',
    effect: '理气健脾，燥湿化痰',
    indication: '脘腹胀满，食少吐泻，咳嗽痰多。',
    dosage: '3-10g，煎服。',
    caution: '内有实热、舌红少津者慎用。',
    categories: ['理气药'],
  },
  {
    name: '青皮',
    pinyin: 'qīng pí',
    property: '苦、辛，温',
    meridian: '肝、胆、胃经',
    effect: '疏肝破气，消积化滞',
    indication: '肝郁胁痛乳胀，疝气疼痛，食积腹痛，癥瘕积聚。',
    dosage: '3-10g，煎服。醋炙疏肝止痛力强。',
    caution: '气虚者慎用。',
    categories: ['理气药'],
  },
  {
    name: '枳实',
    pinyin: 'zhǐ shí',
    property: '苦、辛、酸，微寒',
    meridian: '脾、胃、大肠经',
    effect: '破气消积，化痰散痞',
    indication: '积滞内停，痞满胀痛，泻痢后重，大便不通，痰滞气阻之胸痹结胸。',
    dosage: '3-10g，煎服。炒用较平和。',
    caution: '孕妇及脾胃虚弱者慎用。',
    categories: ['理气药'],
  },
  {
    name: '木香',
    pinyin: 'mù xiāng',
    property: '辛、苦，温',
    meridian: '脾、胃、大肠、三焦、胆经',
    effect: '行气止痛，健脾消食',
    indication: '脘腹胀痛，食积不消，泻痢后重，胸胁胀痛，黄疸。',
    dosage: '3-6g，煎服。生用行气力强，煨用止泻力强。',
    caution: '阴虚津液不足者慎用。',
    categories: ['理气药'],
  },
  {
    name: '香附',
    pinyin: 'xiāng fù',
    property: '辛、微苦、微甘，平',
    meridian: '肝、脾、三焦经',
    effect: '疏肝解郁，理气宽中，调经止痛',
    indication: '肝郁气滞之胁痛腹痛，月经不调，痛经，乳房胀痛。',
    dosage: '6-10g，煎服。醋炙止痛力增强。',
    caution: '气虚无滞及阴虚血热者慎用。',
    categories: ['理气药'],
  },
  {
    name: '川楝子',
    pinyin: 'chuān liàn zǐ',
    property: '苦，寒。有小毒',
    meridian: '肝、小肠、膀胱经',
    effect: '疏肝泄热，行气止痛，杀虫',
    indication: '肝郁化火之胸胁脘腹胀痛，疝气疼痛，虫积腹痛。',
    dosage: '5-10g，煎服。外用适量。',
    caution: '有毒，不宜过量或持续服用。脾胃虚寒者慎用。',
    categories: ['理气药'],
  },

  // ==================== 消食药 (4) ====================
  {
    name: '山楂',
    pinyin: 'shān zhā',
    property: '酸、甘，微温',
    meridian: '脾、胃、肝经',
    effect: '消食健胃，行气散瘀，化浊降脂',
    indication: '肉食积滞之脘腹胀满，嗳气吞酸，腹痛泄泻，血瘀经闭，产后腹痛，高脂血症。',
    dosage: '9-12g，煎服。消食散瘀生用或炒用。',
    caution: '胃酸分泌过多者慎用。孕妇慎用。',
    categories: ['消食药'],
  },
  {
    name: '神曲',
    pinyin: 'shén qū',
    property: '甘、辛，温',
    meridian: '脾、胃经',
    effect: '消食和胃',
    indication: '饮食积滞之脘腹胀满，食少纳呆，肠鸣腹泻。',
    dosage: '6-15g，煎服。炒焦健胃力更强。',
    caution: '无特殊禁忌。',
    categories: ['消食药'],
  },
  {
    name: '麦芽',
    pinyin: 'mài yá',
    property: '甘，平',
    meridian: '脾、胃、肝经',
    effect: '行气消食，健脾开胃，回乳消胀',
    indication: '米面薯芋食积，脘腹胀满，脾虚食少，乳汁郁积、断乳。',
    dosage: '10-15g，煎服。回乳用60g，炒用。',
    caution: '哺乳期不宜用。',
    categories: ['消食药'],
  },
  {
    name: '莱菔子',
    pinyin: 'lái fú zǐ',
    property: '辛、甘，平',
    meridian: '肺、脾、胃经',
    effect: '消食除胀，降气化痰',
    indication: '食积气滞之脘腹胀满、嗳腐吞酸，痰壅喘咳。',
    dosage: '5-12g，煎服。炒用降气化痰力强。',
    caution: '不宜与人参同用。气虚无食积者慎用。',
    categories: ['消食药'],
  },

  // ==================== 驱虫药 (3) ====================
  {
    name: '使君子',
    pinyin: 'shǐ jūn zǐ',
    property: '甘，温',
    meridian: '脾、胃经',
    effect: '杀虫消积',
    indication: '蛔虫、蛲虫感染，虫积腹痛，小儿疳积。',
    dosage: '9-12g，捣碎煎服。空腹服。炒香嚼服，小儿每岁1-1.5粒，总量不超过20粒。',
    caution: '不可过量服用。服药时忌饮浓茶。',
    categories: ['驱虫药'],
  },
  {
    name: '槟榔',
    pinyin: 'bīng lang',
    property: '苦、辛，温',
    meridian: '胃、大肠经',
    effect: '杀虫消积，行气利水，截疟',
    indication: '绦虫蛔虫姜片虫等多种肠寄生虫病，食积气滞，泻痢后重，水肿脚气，疟疾。',
    dosage: '3-10g，煎服。驱绦虫、姜片虫30-60g。',
    caution: '脾虚便溏及气虚下陷者忌用。',
    categories: ['驱虫药'],
  },
  {
    name: '苦楝皮',
    pinyin: 'kǔ liàn pí',
    property: '苦，寒。有毒',
    meridian: '肝、脾、胃经',
    effect: '杀虫，疗癣',
    indication: '蛔虫蛲虫钩虫等肠寄生虫病，疥癣湿疮。',
    dosage: '3-6g，煎服。外用适量。',
    caution: '有毒，不宜过量久服。孕妇及肝肾功能不全者忌用。',
    categories: ['驱虫药'],
  },

  // ==================== 止血药 (6) ====================
  {
    name: '大蓟',
    pinyin: 'dà jì',
    property: '甘、苦，凉',
    meridian: '心、肝经',
    effect: '凉血止血，散瘀解毒消痈',
    indication: '血热妄行之吐衄便血崩漏，外伤出血，痈肿疮毒。',
    dosage: '9-15g，煎服。外用适量。',
    caution: '脾胃虚寒者慎用。',
    categories: ['止血药', '凉血止血药'],
  },
  {
    name: '小蓟',
    pinyin: 'xiǎo jì',
    property: '甘，凉',
    meridian: '心、肝经',
    effect: '凉血止血，散瘀解毒消痈',
    indication: '血热妄行之吐衄尿血崩漏，血淋涩痛，痈肿疮毒。',
    dosage: '5-12g，煎服。外用适量。尤善治尿血、血淋。',
    caution: '脾胃虚寒者慎用。',
    categories: ['止血药', '凉血止血药'],
  },
  {
    name: '地榆',
    pinyin: 'dì yú',
    property: '苦、酸、涩，微寒',
    meridian: '肝、大肠经',
    effect: '凉血止血，解毒敛疮',
    indication: '血热妄行之便血痔血崩漏，水火烫伤，湿疹疮疡。',
    dosage: '9-15g，煎服。止血炒炭，治烫伤生用。外用适量。',
    caution: '大面积烧伤不宜外涂以防中毒。',
    categories: ['止血药', '凉血止血药'],
  },
  {
    name: '白及',
    pinyin: 'bái jí',
    property: '苦、甘、涩，微寒',
    meridian: '肺、肝、胃经',
    effect: '收敛止血，消肿生肌',
    indication: '内外出血诸证，如咯血吐血衄血，外伤出血，疮疡肿毒，皮肤皲裂。',
    dosage: '6-15g，煎服。研末服3-6g。外用适量。',
    caution: '不宜与川乌、草乌、附子同用。',
    categories: ['止血药', '收敛止血药'],
  },
  {
    name: '三七',
    pinyin: 'sān qī',
    property: '甘、微苦，温',
    meridian: '肝、胃经',
    effect: '散瘀止血，消肿定痛',
    indication: '内外出血诸证，瘀血肿痛，跌打损伤。',
    dosage: '3-9g，煎服。研粉吞服1-3g。外用适量。',
    caution: '孕妇慎用。',
    categories: ['止血药', '化瘀止血药'],
  },
  {
    name: '艾叶',
    pinyin: 'ài yè',
    property: '辛、苦，温。有小毒',
    meridian: '肝、脾、肾经',
    effect: '温经止血，散寒止痛，调经安胎，外用燥湿止痒',
    indication: '虚寒性出血证如崩漏，月经不调，痛经，胎动不安，外用治皮肤瘙痒。',
    dosage: '3-9g，煎服。炒炭止血，生用散寒调经。外用适量。',
    caution: '阴虚血热者忌用。',
    categories: ['止血药', '温经止血药'],
  },

  // ==================== 活血化瘀药 (8) ====================
  {
    name: '川芎',
    pinyin: 'chuān xiōng',
    property: '辛，温',
    meridian: '肝、胆、心包经',
    effect: '活血行气，祛风止痛',
    indication: '血瘀气滞之胸痹心痛、胁痛腹痛，月经不调，经闭痛经，头痛，风湿痹痛。',
    dosage: '3-10g，煎服。',
    caution: '阴虚火旺、月经过多者慎用。孕妇忌用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '延胡索',
    pinyin: 'yán hú suǒ',
    property: '辛、苦，温',
    meridian: '肝、脾、心经',
    effect: '活血行气，止痛',
    indication: '气血瘀滞之诸痛证，如胸痹心痛、脘腹疼痛、经闭痛经、产后腹痛、跌打肿痛。',
    dosage: '3-10g，煎服。醋制可增效。研末服1.5-3g。',
    caution: '孕妇忌用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '郁金',
    pinyin: 'yù jīn',
    property: '辛、苦，寒',
    meridian: '肝、胆、心经',
    effect: '活血止痛，行气解郁，清心凉血，利胆退黄',
    indication: '气滞血瘀之胸胁脘腹刺痛，经闭痛经，热病神昏，吐血衄血，黄疸。',
    dosage: '3-10g，煎服。',
    caution: '不宜与丁香同用。孕妇慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '丹参',
    pinyin: 'dān shēn',
    property: '苦，微寒',
    meridian: '心、肝经',
    effect: '活血祛瘀，通经止痛，清心除烦，凉血消痈',
    indication: '血瘀经闭痛经，胸痹心痛，脘腹胁痛，癥瘕积聚，疮疡肿痛，心烦不眠。',
    dosage: '10-15g，煎服。',
    caution: '不宜与藜芦同用。孕妇慎用。',
    categories: ['活血化瘀药', '活血调经药'],
  },
  {
    name: '红花',
    pinyin: 'hóng huā',
    property: '辛，温',
    meridian: '心、肝经',
    effect: '活血通经，散瘀止痛',
    indication: '血瘀经闭痛经，产后恶露不行，癥瘕痞块，胸痹心痛，跌打损伤，疮疡肿痛。',
    dosage: '3-10g，煎服。',
    caution: '孕妇忌用。有出血倾向者慎用。',
    categories: ['活血化瘀药', '活血调经药'],
  },
  {
    name: '桃仁',
    pinyin: 'táo rén',
    property: '苦、甘，平。有小毒',
    meridian: '心、肝、大肠经',
    effect: '活血祛瘀，润肠通便，止咳平喘',
    indication: '血瘀经闭痛经，癥瘕痞块，跌打损伤，肠燥便秘，咳嗽气喘。',
    dosage: '5-10g，打碎煎服。',
    caution: '孕妇忌用。过量可致中毒。',
    categories: ['活血化瘀药', '活血调经药'],
  },
  {
    name: '益母草',
    pinyin: 'yì mǔ cǎo',
    property: '苦、辛，微寒',
    meridian: '肝、心包、膀胱经',
    effect: '活血调经，利尿消肿，清热解毒',
    indication: '血瘀月经不调，痛经经闭，恶露不尽，水肿尿少，疮疡肿毒。',
    dosage: '9-30g，煎服。鲜品12-40g。',
    caution: '孕妇忌用。',
    categories: ['活血化瘀药', '活血调经药'],
  },
  {
    name: '牛膝',
    pinyin: 'niú xī',
    property: '苦、甘、酸，平',
    meridian: '肝、肾经',
    effect: '活血通经，补肝肾，强筋骨，利水通淋，引血下行',
    indication: '血瘀经闭痛经，腰膝酸软，筋骨无力，淋证水肿，头痛眩晕，吐血衄血。',
    dosage: '5-12g，煎服。',
    caution: '孕妇及月经过多者忌用。',
    categories: ['活血化瘀药', '活血调经药'],
  },

  // ==================== 化痰止咳平喘药 (8) ====================
  {
    name: '半夏',
    pinyin: 'bàn xià',
    property: '辛，温。有毒',
    meridian: '脾、胃、肺经',
    effect: '燥湿化痰，降逆止呕，消痞散结',
    indication: '湿痰寒痰咳喘，痰饮眩悸，呕吐反胃，胸脘痞闷，梅核气，瘿瘤痰核，痈疽肿毒。',
    dosage: '3-9g，煎服。外用适量。',
    caution: '不宜与川乌、草乌、附子同用。阴虚燥咳及孕妇慎用。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '天南星',
    pinyin: 'tiān nán xīng',
    property: '苦、辛，温。有毒',
    meridian: '肺、肝、脾经',
    effect: '燥湿化痰，祛风止痉，散结消肿',
    indication: '顽痰咳嗽，风痰眩晕，中风痰壅，口眼歪斜，癫痫，破伤风，痈肿瘰疬。',
    dosage: '3-9g，煎服。外用适量。',
    caution: '孕妇忌用。阴虚燥咳者不宜用。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '川贝母',
    pinyin: 'chuān bèi mǔ',
    property: '苦、甘，微寒',
    meridian: '肺、心经',
    effect: '清热润肺，化痰止咳，散结消痈',
    indication: '肺热燥咳，干咳少痰，阴虚劳嗽，痰中带血，瘰疬，乳痈。',
    dosage: '3-10g，煎服。研末冲服1-2g。',
    caution: '不宜与川乌、草乌、附子同用。脾胃虚寒者慎用。',
    categories: ['化痰止咳平喘药', '清化热痰药'],
  },
  {
    name: '浙贝母',
    pinyin: 'zhè bèi mǔ',
    property: '苦，寒',
    meridian: '肺、心经',
    effect: '清热化痰，散结解毒',
    indication: '风热或痰热咳嗽，肺痈吐脓，瘰疬瘿瘤，疮痈肿毒。',
    dosage: '5-10g，煎服。',
    caution: '不宜与川乌、草乌、附子同用。脾胃虚寒者慎用。',
    categories: ['化痰止咳平喘药', '清化热痰药'],
  },
  {
    name: '瓜蒌',
    pinyin: 'guā lóu',
    property: '甘、微苦，寒',
    meridian: '肺、胃、大肠经',
    effect: '清热涤痰，宽胸散结，润肠通便',
    indication: '痰热咳嗽，胸痹结胸，乳痈肿痛，肠燥便秘。',
    dosage: '9-15g，煎服。',
    caution: '不宜与川乌、草乌、附子同用。脾胃虚寒便溏者忌用。',
    categories: ['化痰止咳平喘药', '清化热痰药'],
  },
  {
    name: '桔梗',
    pinyin: 'jú gěng',
    property: '苦、辛，平',
    meridian: '肺经',
    effect: '宣肺利咽，祛痰排脓',
    indication: '咳嗽痰多，胸闷不畅，咽痛音哑，肺痈吐脓。',
    dosage: '3-10g，煎服。',
    caution: '凡气机上逆之呕吐、呛咳、眩晕，及阴虚久咳、咳血者不宜用。',
    categories: ['化痰止咳平喘药', '清化热痰药'],
  },
  {
    name: '杏仁',
    pinyin: 'xìng rén',
    property: '苦，微温。有小毒',
    meridian: '肺、大肠经',
    effect: '降气止咳平喘，润肠通便',
    indication: '咳嗽气喘，胸满痰多，肠燥便秘。',
    dosage: '5-10g，煎服。打碎入煎剂。',
    caution: '有小毒，不宜过量。婴幼儿慎用。',
    categories: ['化痰止咳平喘药', '止咳平喘药'],
  },
  {
    name: '百部',
    pinyin: 'bǎi bù',
    property: '甘、苦，微温',
    meridian: '肺经',
    effect: '润肺止咳，杀虫灭虱',
    indication: '新久咳嗽，肺痨咳嗽，百日咳，蛲虫蛔虫，头虱体虱。',
    dosage: '3-9g，煎服。外用适量。',
    caution: '脾胃虚弱者慎用。',
    categories: ['化痰止咳平喘药', '止咳平喘药'],
  },

  // ==================== 安神药 (5) ====================
  {
    name: '朱砂',
    pinyin: 'zhū shā',
    property: '甘，微寒。有毒',
    meridian: '心经',
    effect: '清心镇惊，安神明目',
    indication: '心神不宁，心悸易惊，失眠多梦，癫痫发狂，小儿惊风，目赤翳障。',
    dosage: '0.1-0.5g，入丸散服。不入煎剂。外用适量。',
    caution: '有毒，不宜过量久服。肝肾功能不全者忌用。忌火煅。',
    categories: ['安神药', '重镇安神药'],
  },
  {
    name: '磁石',
    pinyin: 'cí shí',
    property: '辛、咸，寒',
    meridian: '肝、心、肾经',
    effect: '镇惊安神，平肝潜阳，聪耳明目，纳气平喘',
    indication: '惊悸失眠，头晕目眩，耳鸣耳聋，视物昏花，肾虚气喘。',
    dosage: '9-30g，先煎。入丸散1-3g。',
    caution: '脾胃虚弱者慎用。',
    categories: ['安神药', '重镇安神药'],
  },
  {
    name: '龙骨',
    pinyin: 'lóng gǔ',
    property: '甘、涩，平',
    meridian: '心、肝、肾经',
    effect: '镇惊安神，平肝潜阳，收敛固涩',
    indication: '心神不宁，心悸失眠，惊痫癫狂，肝阳上亢之头晕目眩，遗精滑精，自汗盗汗，崩漏带下。',
    dosage: '15-30g，先煎。外用适量。',
    caution: '湿热积滞者慎用。',
    categories: ['安神药', '重镇安神药'],
  },
  {
    name: '酸枣仁',
    pinyin: 'suān zǎo rén',
    property: '甘、酸，平',
    meridian: '心、肝、胆经',
    effect: '养心安神，敛汗生津',
    indication: '虚烦不眠，惊悸多梦，体虚多汗，津伤口渴。',
    dosage: '10-15g，煎服。捣碎入煎。',
    caution: '凡有实邪郁火者慎用。',
    categories: ['安神药', '养心安神药'],
  },
  {
    name: '远志',
    pinyin: 'yuǎn zhì',
    property: '苦、辛，温',
    meridian: '心、肾、肺经',
    effect: '安神益智，交通心肾，祛痰开窍，消散痈肿',
    indication: '失眠多梦，健忘惊悸，神志恍惚，咳痰不爽，疮疡肿毒，乳房肿痛。',
    dosage: '3-10g，煎服。',
    caution: '不宜与藜芦同用。胃溃疡及胃炎者慎用。',
    categories: ['安神药', '养心安神药'],
  },

  // ==================== 平肝息风药 (6) ====================
  {
    name: '石决明',
    pinyin: 'shí jué míng',
    property: '咸，寒',
    meridian: '肝经',
    effect: '平肝潜阳，清肝明目',
    indication: '肝阳上亢之头晕目眩，目赤翳障，视物昏花。',
    dosage: '15-30g，先煎。',
    caution: '脾胃虚寒便溏者慎用。',
    categories: ['平肝息风药', '平抑肝阳药'],
  },
  {
    name: '牡蛎',
    pinyin: 'mǔ lì',
    property: '咸，微寒',
    meridian: '肝、肾经',
    effect: '平肝潜阳，重镇安神，软坚散结，收敛固涩',
    indication: '肝阳上亢之眩晕耳鸣，惊悸失眠，瘰疬痰核，癥瘕痞块，自汗盗汗，遗精崩漏。',
    dosage: '15-30g，先煎。收敛固涩宜煅用。',
    caution: '有湿热实邪者忌用。',
    categories: ['平肝息风药', '平抑肝阳药'],
  },
  {
    name: '代赭石',
    pinyin: 'dài zhě shí',
    property: '苦，寒',
    meridian: '肝、心经',
    effect: '平肝潜阳，重镇降逆，凉血止血',
    indication: '肝阳上亢之眩晕耳鸣，呕吐呃逆，噫气，喘息，血热吐衄崩漏。',
    dosage: '10-30g，先煎。入丸散1-3g。',
    caution: '孕妇慎用。不宜久服。',
    categories: ['平肝息风药', '平抑肝阳药'],
  },
  {
    name: '钩藤',
    pinyin: 'gōu téng',
    property: '甘，微寒',
    meridian: '肝、心包经',
    effect: '息风定惊，清热平肝',
    indication: '肝风内动之惊痫抽搐，肝阳上亢之头痛眩晕，外感风热之头痛目赤。',
    dosage: '3-12g，煎服。不宜久煎（后下）。',
    caution: '无风热及实热者不宜用。',
    categories: ['平肝息风药', '息风止痉药'],
  },
  {
    name: '天麻',
    pinyin: 'tiān má',
    property: '甘，平',
    meridian: '肝经',
    effect: '息风止痉，平抑肝阳，祛风通络',
    indication: '肝风内动之惊痫抽搐，肝阳上亢之头痛眩晕，肢体麻木，风湿痹痛。',
    dosage: '3-10g，煎服。研末吞服1-1.5g。',
    caution: '无特殊禁忌。',
    categories: ['平肝息风药', '息风止痉药'],
  },
  {
    name: '全蝎',
    pinyin: 'quán xiē',
    property: '辛，平。有毒',
    meridian: '肝经',
    effect: '息风镇痉，通络止痛，攻毒散结',
    indication: '肝风内动之痉挛抽搐，中风口眼歪斜，偏正头痛，风湿顽痹，疮疡肿毒，瘰疬痰核。',
    dosage: '3-6g，煎服。研末吞服0.6-1g。外用适量。',
    caution: '有毒，用量不宜过大。孕妇忌用。',
    categories: ['平肝息风药', '息风止痉药'],
  },

  // ==================== 补虚药 (12) ====================
  {
    name: '人参',
    pinyin: 'rén shēn',
    property: '甘、微苦，微温',
    meridian: '脾、肺、心、肾经',
    effect: '大补元气，复脉固脱，补脾益肺，生津养血，安神益智',
    indication: '体虚欲脱，肢冷脉微，脾虚食少，肺虚喘咳，津伤口渴，气血亏虚，惊悸失眠，阳痿宫冷。',
    dosage: '3-9g，另煎兑服。研末吞服1-2g。',
    caution: '不宜与藜芦、五灵脂同用。实证热证忌用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '党参',
    pinyin: 'dǎng shēn',
    property: '甘，平',
    meridian: '脾、肺经',
    effect: '补中益气，健脾益肺，养血生津',
    indication: '脾肺气虚之食少倦怠，咳嗽虚喘，气血两虚之面色萎黄，气津两伤之气短口渴。',
    dosage: '9-30g，煎服。',
    caution: '不宜与藜芦同用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '黄芪',
    pinyin: 'huáng qí',
    property: '甘，微温',
    meridian: '脾、肺经',
    effect: '补气升阳，固表止汗，利水消肿，托疮生肌',
    indication: '气虚乏力，食少便溏，中气下陷，久泻脱肛，便血崩漏，表虚自汗，水肿尿少，疮疡难溃难敛。',
    dosage: '9-30g，煎服。炙用补中益气，生用固表托毒。',
    caution: '表实邪盛、气滞湿阻、阴虚阳亢者忌用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '白术',
    pinyin: 'bái zhú',
    property: '甘、苦，温',
    meridian: '脾、胃经',
    effect: '补气健脾，燥湿利水，止汗，安胎',
    indication: '脾虚食少，腹胀泄泻，痰饮眩悸，水肿，自汗，胎动不安。',
    dosage: '6-12g，煎服。燥湿利水生用，补气健脾炒用。',
    caution: '阴虚内热及津液亏耗者忌用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '甘草',
    pinyin: 'gān cǎo',
    property: '甘，平',
    meridian: '心、肺、脾、胃经',
    effect: '补脾益气，清热解毒，祛痰止咳，缓急止痛，调和诸药',
    indication: '脾胃虚弱，倦怠乏力，咳嗽痰多，脘腹四肢挛急疼痛，痈肿疮毒，缓解药物毒性烈性。',
    dosage: '2-10g，煎服。清热解毒生用，补中缓急炙用。',
    caution: '不宜与海藻、京大戟、红大戟、甘遂、芫花同用。湿盛中满者忌用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '当归',
    pinyin: 'dāng guī',
    property: '甘、辛，温',
    meridian: '肝、心、脾经',
    effect: '补血活血，调经止痛，润肠通便',
    indication: '血虚萎黄，眩晕心悸，月经不调，经闭痛经，虚寒腹痛，风湿痹痛，跌打损伤，肠燥便秘。',
    dosage: '6-12g，煎服。补血用归身，活血用归尾。',
    caution: '湿盛中满、大便溏泄者慎用。',
    categories: ['补虚药', '补血药'],
  },
  {
    name: '熟地黄',
    pinyin: 'shú dì huáng',
    property: '甘，微温',
    meridian: '肝、肾经',
    effect: '补血滋阴，益精填髓',
    indication: '血虚萎黄，心悸怔忡，月经不调，崩漏下血；肝肾阴虚之腰膝酸软，骨蒸潮热，盗汗遗精，眩晕耳鸣。',
    dosage: '9-15g，煎服。',
    caution: '脾胃虚弱、气滞痰多、腹满便溏者忌用。',
    categories: ['补虚药', '补血药'],
  },
  {
    name: '白芍',
    pinyin: 'bái sháo',
    property: '苦、酸，微寒',
    meridian: '肝、脾经',
    effect: '养血调经，柔肝止痛，平抑肝阳，敛阴止汗',
    indication: '血虚萎黄，月经不调，崩漏，胁肋脘腹疼痛，四肢挛急疼痛，肝阳上亢之头痛眩晕，自汗盗汗。',
    dosage: '6-15g，煎服。',
    caution: '不宜与藜芦同用。虚寒腹痛泄泻者慎用。',
    categories: ['补虚药', '补血药'],
  },
  {
    name: '阿胶',
    pinyin: 'ē jiāo',
    property: '甘，平',
    meridian: '肺、肝、肾经',
    effect: '补血止血，滋阴润燥',
    indication: '血虚萎黄，眩晕心悸，出血诸证如吐血衄血便血崩漏，阴虚燥咳，热病伤阴之虚烦不眠。',
    dosage: '3-9g，烊化兑服。',
    caution: '脾胃虚弱、食欲不振、便溏者慎用。',
    categories: ['补虚药', '补血药'],
  },
  {
    name: '麦冬',
    pinyin: 'mài dōng',
    property: '甘、微苦，微寒',
    meridian: '心、肺、胃经',
    effect: '养阴生津，润肺清心',
    indication: '肺燥干咳，阴虚劳嗽，喉痹咽痛，津伤口渴，内热消渴，心烦失眠，肠燥便秘。',
    dosage: '6-12g，煎服。',
    caution: '脾胃虚寒、风寒咳嗽者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '枸杞子',
    pinyin: 'gǒu qǐ zǐ',
    property: '甘，平',
    meridian: '肝、肾经',
    effect: '滋补肝肾，益精明目',
    indication: '肝肾阴虚之虚劳精亏，腰膝酸痛，眩晕耳鸣，目昏不明，内热消渴，血虚萎黄。',
    dosage: '6-12g，煎服。',
    caution: '外感实热及脾虚便溏者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '鹿茸',
    pinyin: 'lù róng',
    property: '甘、咸，温',
    meridian: '肾、肝经',
    effect: '壮肾阳，益精血，强筋骨，调冲任，托疮毒',
    indication: '肾阳不足之阳痿早泄，宫冷不孕，精血亏虚之筋骨痿软，骨弱行迟，冲任虚寒之崩漏带下，疮疡久溃不敛。',
    dosage: '1-2g，研末冲服。或入丸散。',
    caution: '阴虚阳亢、血分有热及外感热病者忌用。宜从小量开始。',
    categories: ['补虚药', '补阳药'],
  },

  // ==================== 收涩药 (5) ====================
  {
    name: '五味子',
    pinyin: 'wǔ wèi zǐ',
    property: '酸、甘，温',
    meridian: '肺、心、肾经',
    effect: '收敛固涩，益气生津，补肾宁心',
    indication: '久咳虚喘，自汗盗汗，遗精滑精，久泻不止，津伤口渴，消渴，心悸失眠。',
    dosage: '2-6g，煎服。研末服1-3g。',
    caution: '表邪未解、内有实热者忌用。',
    categories: ['收涩药', '固精缩尿止带药'],
  },
  {
    name: '乌梅',
    pinyin: 'wū méi',
    property: '酸、涩，平',
    meridian: '肝、脾、肺、大肠经',
    effect: '敛肺止咳，涩肠止泻，生津止渴，安蛔止痛',
    indication: '久咳不止，久泻久痢，虚热消渴，蛔厥腹痛。',
    dosage: '6-12g，煎服。',
    caution: '表邪未解及内有实热积滞者忌用。',
    categories: ['收涩药', '敛肺涩肠药'],
  },
  {
    name: '山茱萸',
    pinyin: 'shān zhū yú',
    property: '酸、涩，微温',
    meridian: '肝、肾经',
    effect: '补益肝肾，收敛固涩',
    indication: '肝肾亏虚之腰膝酸软，头晕耳鸣，阳痿遗精，遗尿尿频，崩漏带下，大汗虚脱。',
    dosage: '6-12g，煎服。',
    caution: '命门火炽及素有湿热者忌用。',
    categories: ['收涩药', '固精缩尿止带药'],
  },
  {
    name: '桑螵蛸',
    pinyin: 'sāng piāo xiāo',
    property: '甘、咸，平',
    meridian: '肝、肾经',
    effect: '固精缩尿，补肾助阳',
    indication: '遗精滑精，遗尿尿频，小便白浊，阳痿早泄。',
    dosage: '5-10g，煎服。',
    caution: '阴虚火旺及膀胱湿热者忌用。',
    categories: ['收涩药', '固精缩尿止带药'],
  },
  {
    name: '莲子',
    pinyin: 'lián zǐ',
    property: '甘、涩，平',
    meridian: '脾、肾、心经',
    effect: '补脾止泻，益肾固精，养心安神',
    indication: '脾虚久泻，食欲不振，遗精滑精，遗尿尿频，心悸失眠。',
    dosage: '6-15g，煎服。',
    caution: '中满痞胀及大便燥结者忌用。',
    categories: ['收涩药', '固精缩尿止带药'],
  },

  // ==================== 祛风湿清热药补充 (6) ====================
  {
    name: '秦艽',
    pinyin: 'qín jiāo',
    property: '辛、苦，平',
    meridian: '胃、肝、胆经',
    effect: '祛风湿，止痹痛，退虚热，清湿热',
    indication: '风湿痹痛，筋脉拘挛，骨节酸痛，中风半身不遂，骨蒸潮热，湿热黄疸。',
    dosage: '3-10g，煎服。',
    caution: '脾胃虚寒者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '防己',
    pinyin: 'fáng jǐ',
    property: '苦、辛，寒',
    meridian: '膀胱、肺经',
    effect: '祛风止痛，利水消肿',
    indication: '风湿痹痛，水肿脚气，小便不利，湿疹疮毒。',
    dosage: '5-10g，煎服。',
    caution: '脾胃虚寒、阴虚及无湿热者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '桑枝',
    pinyin: 'sāng zhī',
    property: '微苦，平',
    meridian: '肝经',
    effect: '祛风湿，利关节',
    indication: '风湿痹痛，肩臂关节酸痛麻木，水肿。',
    dosage: '9-15g，煎服。',
    caution: '风寒湿痹偏寒者宜配伍温经散寒药。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '豨莶草',
    pinyin: 'xī xiān cǎo',
    property: '辛、苦，寒',
    meridian: '肝、肾经',
    effect: '祛风湿，利关节，清热解毒',
    indication: '风湿痹痛，筋骨无力，腰膝酸软，半身不遂，风疹湿疮，痈肿疮毒。',
    dosage: '9-12g，煎服。外用适量。',
    caution: '阴血不足者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '络石藤',
    pinyin: 'luò shí téng',
    property: '苦，微寒',
    meridian: '心、肝、肾经',
    effect: '祛风通络，凉血消肿',
    indication: '风湿热痹，筋脉拘挛，腰膝酸痛，喉痹，痈肿，跌打损伤。',
    dosage: '6-12g，煎服。',
    caution: '阳虚畏寒、便溏者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },
  {
    name: '海风藤',
    pinyin: 'hǎi fēng téng',
    property: '辛、苦，微温',
    meridian: '肝经',
    effect: '祛风湿，通经络，止痹痛',
    indication: '风寒湿痹，关节疼痛，筋脉拘挛，屈伸不利，跌打损伤。',
    dosage: '6-12g，煎服。',
    caution: '阴虚火旺者慎用。',
    categories: ['祛风湿药', '祛风湿清热药'],
  },

  // ==================== 利水渗湿药补充 (5) ====================
  {
    name: '猪苓',
    pinyin: 'zhū líng',
    property: '甘、淡，平',
    meridian: '肾、膀胱经',
    effect: '利水渗湿',
    indication: '水肿，小便不利，泄泻，淋浊，带下。',
    dosage: '6-12g，煎服。',
    caution: '无水湿者忌用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '冬瓜皮',
    pinyin: 'dōng guā pí',
    property: '甘，凉',
    meridian: '脾、小肠经',
    effect: '利水消肿，清热解暑',
    indication: '水肿胀满，小便不利，暑热口渴，小便短赤。',
    dosage: '9-30g，煎服。',
    caution: '脾胃虚寒者慎用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '玉米须',
    pinyin: 'yù mǐ xū',
    property: '甘，平',
    meridian: '膀胱、肝、胆经',
    effect: '利水消肿，利湿退黄',
    indication: '水肿，小便不利，湿热黄疸，胆囊炎，胆石症。',
    dosage: '15-30g，煎服。鲜品加倍。',
    caution: '无明显禁忌。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '葫芦',
    pinyin: 'hú lu',
    property: '甘，平',
    meridian: '肺、小肠经',
    effect: '利水消肿，清热散结',
    indication: '水肿胀满，腹水，热淋，疮痈肿毒。',
    dosage: '15-30g，煎服。',
    caution: '脾胃虚寒者慎用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },
  {
    name: '泽漆',
    pinyin: 'zé qī',
    property: '辛、苦，微寒。有毒',
    meridian: '肺、小肠、大肠经',
    effect: '利水消肿，化痰散结，解毒杀虫',
    indication: '水肿胀满，痰饮喘咳，瘰疬，癣疮。',
    dosage: '5-10g，煎服。外用适量。',
    caution: '有毒，不宜过量或久服。脾胃虚寒者慎用。',
    categories: ['利水渗湿药', '利水消肿药'],
  },

  // ==================== 温里药补充 (5) ====================
  {
    name: '高良姜',
    pinyin: 'gāo liáng jiāng',
    property: '辛，热',
    meridian: '脾、胃经',
    effect: '温中散寒，止痛止呕',
    indication: '脘腹冷痛，胃寒呕吐，嗳气吞酸。',
    dosage: '3-6g，煎服。研末服1-3g。',
    caution: '阴虚有热者忌用。',
    categories: ['温里药'],
  },
  {
    name: '花椒',
    pinyin: 'huā jiāo',
    property: '辛，温',
    meridian: '脾、胃、肾经',
    effect: '温中止痛，杀虫止痒',
    indication: '脘腹冷痛，呕吐泄泻，虫积腹痛，蛔虫症；外治湿疹瘙痒。',
    dosage: '3-6g，煎服。外用适量。',
    caution: '阴虚火旺者忌用。孕妇慎用。',
    categories: ['温里药'],
  },
  {
    name: '胡椒',
    pinyin: 'hú jiāo',
    property: '辛，热',
    meridian: '胃、大肠经',
    effect: '温中散寒，下气消痰',
    indication: '胃寒呕吐，腹痛泄泻，食欲不振，癫痫痰多。',
    dosage: '0.6-1.5g，研末吞服。外用适量。',
    caution: '阴虚有热者忌用。',
    categories: ['温里药'],
  },
  {
    name: '荜茇',
    pinyin: 'bì bá',
    property: '辛，热',
    meridian: '胃、大肠经',
    effect: '温中散寒，下气止痛',
    indication: '脘腹冷痛，呕吐泄泻，寒凝气滞，头痛牙痛。',
    dosage: '1-3g，煎服。外用适量。',
    caution: '阴虚火旺者忌用。',
    categories: ['温里药'],
  },
  {
    name: '荜澄茄',
    pinyin: 'bì chéng qié',
    property: '辛，温',
    meridian: '脾、胃、肾、膀胱经',
    effect: '温中散寒，行气止痛',
    indication: '胃寒腹痛，呕吐泄泻，呃逆，寒疝腹痛，小便浑浊。',
    dosage: '1-3g，煎服。',
    caution: '阴虚火旺者忌用。',
    categories: ['温里药'],
  },

  // ==================== 理气药补充 (5) ====================
  {
    name: '乌药',
    pinyin: 'wū yào',
    property: '辛，温',
    meridian: '肺、脾、肾、膀胱经',
    effect: '行气止痛，温肾散寒',
    indication: '寒凝气滞之胸胁脘腹胀痛，寒疝腹痛，经行腹痛，肾阳不足之遗尿尿频。',
    dosage: '6-10g，煎服。',
    caution: '气虚及阴虚内热者慎用。',
    categories: ['理气药'],
  },
  {
    name: '檀香',
    pinyin: 'tán xiāng',
    property: '辛，温',
    meridian: '脾、胃、心、肺经',
    effect: '行气温中，开胃止痛',
    indication: '寒凝气滞之胸膈不舒，胸痹心痛，脘腹冷痛，呕吐食少。',
    dosage: '2-5g，煎服。入丸散1-3g。后下。',
    caution: '阴虚火旺者忌用。',
    categories: ['理气药'],
  },
  {
    name: '沉香',
    pinyin: 'chén xiāng',
    property: '辛、苦，微温',
    meridian: '脾、胃、肾经',
    effect: '行气止痛，温中止呕，纳气平喘',
    indication: '寒凝气滞之胸胁脘腹胀痛，胃寒呕吐，肾不纳气之虚喘。',
    dosage: '1-5g，煎服。后下。或研末冲服0.5-1g。',
    caution: '阴虚火旺及气虚下陷者慎用。',
    categories: ['理气药'],
  },
  {
    name: '柿蒂',
    pinyin: 'shì dì',
    property: '苦、涩，平',
    meridian: '胃经',
    effect: '降气止呃',
    indication: '呃逆证，无论寒热虚实均可配伍应用。',
    dosage: '6-10g，煎服。',
    caution: '无特殊禁忌。',
    categories: ['理气药'],
  },
  {
    name: '荔枝核',
    pinyin: 'lì zhī hé',
    property: '甘、微苦，温',
    meridian: '肝、肾经',
    effect: '行气散结，散寒止痛',
    indication: '寒疝腹痛，睾丸肿痛，胃脘痛，痛经及产后腹痛。',
    dosage: '6-10g，煎服。',
    caution: '阴虚火旺者慎用。',
    categories: ['理气药'],
  },

  // ==================== 活血化瘀药补充 (8) ====================
  {
    name: '薑黄',
    pinyin: 'jiāng huáng',
    property: '辛、苦，温',
    meridian: '肝、脾经',
    effect: '活血行气，通经止痛',
    indication: '血瘀气滞之胸胁刺痛、闭经痛经，风湿肩臂疼痛，跌打损伤。',
    dosage: '3-10g，煎服。外用适量。',
    caution: '孕妇慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '乳香',
    pinyin: 'rǔ xiāng',
    property: '辛、苦，温',
    meridian: '心、肝、脾经',
    effect: '活血定痛，消肿生肌',
    indication: '跌打损伤，瘀血肿痛，痈疽疮疡，疮口不敛，风湿痹痛，心腹诸痛。',
    dosage: '3-10g，煎服。或入丸散。外用适量。',
    caution: '孕妇忌用。胃弱者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '没药',
    pinyin: 'mò yào',
    property: '辛、苦，平',
    meridian: '心、肝、脾经',
    effect: '散瘀定痛，消肿生肌',
    indication: '跌打损伤，瘀血肿痛，痈疽疮疡，疮口不敛，心腹疼痛，风湿痹痛。',
    dosage: '3-10g，煎服。或入丸散。外用适量。',
    caution: '孕妇忌用。胃弱者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '五灵脂',
    pinyin: 'wǔ líng zhī',
    property: '苦、咸、甘，温',
    meridian: '肝经',
    effect: '活血止痛，化瘀止血',
    indication: '血瘀所致之胸腹刺痛，痛经，经闭，产后腹痛，崩漏下血。',
    dosage: '3-10g，包煎。或入丸散。',
    caution: '孕妇慎用。不宜与人参同用（十九畏）。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '三棱',
    pinyin: 'sān léng',
    property: '辛、苦，平',
    meridian: '肝、脾经',
    effect: '破血行气，消积止痛',
    indication: '癥瘕痞块，瘀血经闭，食积腹痛，跌打损伤。',
    dosage: '3-10g，煎服。醋制可增强止痛作用。',
    caution: '孕妇忌用。月经过多者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '莪术',
    pinyin: 'é zhú',
    property: '辛、苦，温',
    meridian: '肝、脾经',
    effect: '破血行气，消积止痛',
    indication: '癥瘕痞块，瘀血经闭，食积气滞之腹胀痛，跌打损伤肿痛。',
    dosage: '3-10g，煎服。醋制可增强止痛作用。',
    caution: '孕妇忌用。月经过多者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '水蛭',
    pinyin: 'shuǐ zhì',
    property: '咸、苦，平。有小毒',
    meridian: '肝经',
    effect: '破血通经，逐瘀消癥',
    indication: '血瘀经闭，癥瘕痞块，跌打损伤，瘀血内阻之中风偏瘫。',
    dosage: '1-3g，煎服。研末服0.3-0.5g。',
    caution: '孕妇忌用。体弱血虚者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },
  {
    name: '虻虫',
    pinyin: 'méng chóng',
    property: '苦，微寒。有小毒',
    meridian: '肝经',
    effect: '破血逐瘀，散结消癥',
    indication: '血瘀经闭，癥瘕痞块，跌打损伤，瘀血肿痛。',
    dosage: '1-3g，煎服。研末服0.3-0.6g。',
    caution: '孕妇忌用。体虚无瘀者慎用。',
    categories: ['活血化瘀药', '活血止痛药'],
  },

  // ==================== 化痰药补充 (5) ====================
  {
    name: '天南星',
    pinyin: 'tiān nán xīng',
    property: '苦、辛，温。有毒',
    meridian: '肺、肝、脾经',
    effect: '燥湿化痰，祛风止痉，散结消肿',
    indication: '顽痰咳嗽，风痰眩晕，中风痰壅，癫痫，破伤风；外用治痈肿痰核。',
    dosage: '制南星3-10g，煎服。生品外用适量。',
    caution: '孕妇忌用。阴虚燥痰者忌用。生品有毒内服宜慎。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '白附子',
    pinyin: 'bái fù zǐ',
    property: '辛，温。有毒',
    meridian: '胃、肝经',
    effect: '燥湿化痰，祛风止痉，解毒散结',
    indication: '风痰壅盛之口眼歪斜，中风痰壅，偏正头痛，瘰疬痰核，毒蛇咬伤。',
    dosage: '制白附子3-6g，煎服。外用生品适量。',
    caution: '孕妇忌用。生品有毒内服宜慎。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '白芥子',
    pinyin: 'bái jiè zǐ',
    property: '辛，温',
    meridian: '肺经',
    effect: '温肺化痰，利气散结，通络止痛',
    indication: '寒痰喘咳，悬饮胸胁胀痛，痰湿阻滞经络之肢体麻木、关节肿痛，阴疽流注。',
    dosage: '3-10g，煎服。外用适量。',
    caution: '久咳肺虚及阴虚火旺者忌用。有消化道溃疡者慎用。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '旋覆花',
    pinyin: 'xuán fù huā',
    property: '苦、辛、咸，微温',
    meridian: '肺、脾、胃、大肠经',
    effect: '降气消痰，行水止呕',
    indication: '痰壅气逆之咳喘痰多，痰饮蓄结之胸膈痞满，噫气呕吐。',
    dosage: '3-9g，包煎。',
    caution: '阴虚劳嗽及风热燥咳者忌用。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },
  {
    name: '白前',
    pinyin: 'bái qián',
    property: '辛、苦，微温',
    meridian: '肺经',
    effect: '降气化痰止咳',
    indication: '肺气壅实之咳喘痰多，胸满喘急。无论属寒属热均可应用。',
    dosage: '3-10g，煎服。',
    caution: '阴虚劳嗽者慎用。',
    categories: ['化痰止咳平喘药', '温化寒痰药'],
  },

  // ==================== 安神药补充 (4) ====================
  {
    name: '磁石',
    pinyin: 'cí shí',
    property: '咸，寒',
    meridian: '肝、心、肾经',
    effect: '镇惊安神，平肝潜阳，聪耳明目，纳气平喘',
    indication: '心神不宁之惊悸失眠，肝阳上亢之头晕目眩，肾虚耳鸣耳聋，视物昏花，肾不纳气之虚喘。',
    dosage: '9-30g，先煎。或入丸散。',
    caution: '脾胃虚寒者慎用。',
    categories: ['安神药', '重镇安神药'],
  },
  {
    name: '琥珀',
    pinyin: 'hǔ pò',
    property: '甘，平',
    meridian: '心、肝、膀胱经',
    effect: '镇惊安神，活血散瘀，利尿通淋',
    indication: '心神不宁之心悸失眠惊风，瘀血经闭癥瘕，血淋石淋热淋。',
    dosage: '1.5-3g，研末冲服。不入煎剂。',
    caution: '阴虚内热及无瘀滞者慎用。',
    categories: ['安神药', '重镇安神药'],
  },
  {
    name: '合欢皮',
    pinyin: 'hé huān pí',
    property: '甘，平',
    meridian: '心、肝、肺经',
    effect: '解郁安神，活血消肿',
    indication: '忧郁失眠，心神不宁，跌打损伤，痈肿疮毒。',
    dosage: '6-12g，煎服。外用适量。',
    caution: '孕妇慎用。',
    categories: ['安神药', '养心安神药'],
  },
  {
    name: '柏子仁',
    pinyin: 'bǎi zǐ rén',
    property: '甘，平',
    meridian: '心、肾、大肠经',
    effect: '养心安神，润肠通便，止汗',
    indication: '阴血不足之心悸失眠，肠燥便秘，阴虚盗汗。',
    dosage: '3-10g，煎服。',
    caution: '便溏及痰多者慎用。',
    categories: ['安神药', '养心安神药'],
  },

  // ==================== 补虚药补充 (14) ====================
  {
    name: '西洋参',
    pinyin: 'xī yáng shēn',
    property: '甘、微苦，凉',
    meridian: '心、肺、肾经',
    effect: '补气养阴，清热生津',
    indication: '气阴两虚之神疲乏力，口干咽燥，虚热烦倦，咳喘痰血，内热消渴。',
    dosage: '3-6g，煎服。或入丸散。',
    caution: '不宜与藜芦同用（十八反）。中阳虚衰者慎用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '太子参',
    pinyin: 'tài zǐ shēn',
    property: '甘、微苦，平',
    meridian: '脾、肺经',
    effect: '补气生津，健脾润肺',
    indication: '脾虚体倦食少，病后虚弱，气阴不足之自汗口渴，肺燥干咳。',
    dosage: '9-30g，煎服。',
    caution: '邪实而正气不虚者慎用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '大枣',
    pinyin: 'dà zǎo',
    property: '甘，温',
    meridian: '脾、胃、心经',
    effect: '补中益气，养血安神，缓和药性',
    indication: '脾胃虚弱之食少便溏乏力，血虚萎黄，脏躁失眠，缓和峻烈药之性。',
    dosage: '6-15g，煎服。劈开入煎。',
    caution: '湿盛中满、食积、虫积及龋齿作痛者慎用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '蜂蜜',
    pinyin: 'fēng mì',
    property: '甘，平',
    meridian: '肺、脾、大肠经',
    effect: '补中缓急，润肺止咳，润肠通便，解毒',
    indication: '脾胃虚弱之脘腹虚痛，肺燥干咳，肠燥便秘；解乌头类药毒。',
    dosage: '15-30g，冲服。或入丸剂膏剂。',
    caution: '湿盛中满、便溏泄泻者慎用。',
    categories: ['补虚药', '补气药'],
  },
  {
    name: '龙眼肉',
    pinyin: 'lóng yǎn ròu',
    property: '甘，温',
    meridian: '心、脾经',
    effect: '补益心脾，养血安神',
    indication: '心脾两虚之心悸怔忡、失眠健忘，气血不足之面色萎黄。',
    dosage: '9-15g，煎服。或入丸散、浸酒服。',
    caution: '湿盛中满及有痰火者慎用。',
    categories: ['补虚药', '补血药'],
  },
  {
    name: '南沙参',
    pinyin: 'nán shā shēn',
    property: '甘，微寒',
    meridian: '肺、胃经',
    effect: '养阴清肺，益胃生津，化痰益气',
    indication: '肺燥干咳，阴虚劳嗽，痰黏难咯，胃阴不足之口干食少。',
    dosage: '9-15g，煎服。',
    caution: '不宜与藜芦同用。风寒咳嗽者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '北沙参',
    pinyin: 'běi shā shēn',
    property: '甘、微苦，微寒',
    meridian: '肺、胃经',
    effect: '养阴清肺，益胃生津',
    indication: '肺燥干咳，阴虚劳嗽，津伤口渴，胃阴不足。',
    dosage: '5-12g，煎服。',
    caution: '不宜与藜芦同用。风寒咳嗽及脾胃虚寒者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '百合',
    pinyin: 'bǎi hé',
    property: '甘，微寒',
    meridian: '肺、心经',
    effect: '养阴润肺，清心安神',
    indication: '肺燥干咳，阴虚劳嗽，痰中带血，虚烦惊悸，失眠多梦，精神恍惚（百合病）。',
    dosage: '6-12g，煎服。清心宜生用，润肺蜜炙。',
    caution: '风寒咳嗽及中寒便溏者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '天冬',
    pinyin: 'tiān dōng',
    property: '甘、苦，寒',
    meridian: '肺、肾经',
    effect: '养阴润燥，清肺生津，滋肾降火',
    indication: '肺燥干咳，顿咳痰黏，阴虚劳嗽，肾阴亏虚之腰膝酸软，骨蒸潮热，消渴便秘。',
    dosage: '6-12g，煎服。',
    caution: '脾胃虚寒及风寒咳嗽者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '石斛',
    pinyin: 'shí hú',
    property: '甘，微寒',
    meridian: '胃、肾经',
    effect: '益胃生津，滋阴清热',
    indication: '胃阴不足之口燥咽干、食少干呕，肾阴亏虚之目暗不明、腰膝酸软，阴虚发热。',
    dosage: '6-12g，煎服（鲜品15-30g）。宜先煎。',
    caution: '温热病早期阴未伤者、湿温未化燥者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '玉竹',
    pinyin: 'yù zhú',
    property: '甘，微寒',
    meridian: '肺、胃经',
    effect: '养阴润燥，生津止渴',
    indication: '肺燥干咳，阴虚劳嗽，胃阴不足之咽干口渴、消渴，外感温热伤津。',
    dosage: '6-12g，煎服。',
    caution: '痰湿气滞者慎用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '黄精',
    pinyin: 'huáng jīng',
    property: '甘，平',
    meridian: '肺、脾、肾经',
    effect: '补气养阴，健脾润肺，益肾',
    indication: '脾胃气虚之体倦乏力食少，肺燥干咳，肺虚劳嗽，肾虚之腰膝酸软，须发早白。',
    dosage: '9-15g，煎服。',
    caution: '中寒泄泻、痰湿痞满者忌用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '龟甲',
    pinyin: 'guī jiǎ',
    property: '甘、咸，寒',
    meridian: '肾、肝、心经',
    effect: '滋阴潜阳，益肾健骨，养血补心，固经止血',
    indication: '阴虚阳亢之头晕目眩，虚风内动，肾虚骨痿，五迟五软，心虚惊悸失眠，崩漏经多。',
    dosage: '9-24g，先煎。入丸散宜醋淬。',
    caution: '脾胃虚寒及孕妇慎用。',
    categories: ['补虚药', '补阴药'],
  },
  {
    name: '鳖甲',
    pinyin: 'biē jiǎ',
    property: '甘、咸，寒',
    meridian: '肝、肾经',
    effect: '滋阴潜阳，软坚散结，退热除蒸',
    indication: '阴虚发热，骨蒸潮热，虚风内动，癥瘕痞块（肝脾肿大），经闭。',
    dosage: '9-24g，先煎。入丸散宜醋淬。',
    caution: '脾胃虚寒及孕妇慎用。',
    categories: ['补虚药', '补阴药'],
  },
]

const categories = computed(() => {
  const catSet = new Set<string>()
  herbs.forEach(h => h.categories.forEach(c => catSet.add(c)))
  return Array.from(catSet).sort()
})

const filteredHerbs = computed(() => {
  let result = herbs
  if (activeCategory.value) {
    result = result.filter(h => h.categories.some(c => c === activeCategory.value))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(h =>
      h.name.includes(q) ||
      h.pinyin.toLowerCase().includes(q) ||
      h.effect.includes(q) ||
      h.indication.includes(q)
    )
  }
  return result
})

// 药材分类图标映射 — 不同类别用不同SVG图辅助视觉记忆
const HERB_CATEGORY_ICONS: Record<string, string> = {
  '解表药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F343;</text></svg>',
  '清热药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x2744;</text></svg>',
  '泻下药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A7;</text></svg>',
  '祛风湿药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F332;</text></svg>',
  '化湿药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A6;</text></svg>',
  '利水渗湿药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F30A;</text></svg>',
  '温里药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F525;</text></svg>',
  '理气药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A8;</text></svg>',
  '消食药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F372;</text></svg>',
  '驱虫药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F41B;</text></svg>',
  '止血药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1FA78;</text></svg>',
  '活血化瘀药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A5;</text></svg>',
  '化痰止咳平喘药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A8;</text></svg>',
  '安神药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F31B;</text></svg>',
  '平肝息风药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4A8;</text></svg>',
  '补虚药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F4AA;</text></svg>',
  '收涩药': '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F512;</text></svg>',
}
function getHerbIcon(categories: string[]): string {
  for (const cat of categories) {
    if (HERB_CATEGORY_ICONS[cat]) return HERB_CATEGORY_ICONS[cat]
  }
  return '<svg viewBox="0 0 48 48"><text x="24" y="34" text-anchor="middle" font-size="32">&#x1F33F;</text></svg>'
}

// 图片加载状态追踪（用于加载失败时回退到图标）
const failedImages = reactive<Set<string>>(new Set())

function getHerbPhoto(name: string): string | undefined {
  return getHerbImageUrl(name)
}

function onImageError(event: Event, herb: Herb): void {
  failedImages.add(herb.name)
  // 隐藏失败的img元素，让fallback图标显示
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

function isImageFailed(name: string): boolean {
  return failedImages.has(name)
}

function toggleFlip(index: number): void {
  flippedMap[index] = !flippedMap[index]
}
</script>

<style scoped>
.page-herbs {
  /* 宽度动态填充 */
}

.page-header {
  margin-bottom: 20px;
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
  border-color: var(--tcm-primary-400);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* ===== 分类筛选 ===== */
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-base);
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  transition: all var(--tcm-transition-fast);
}

.filter-btn:hover {
  border-color: var(--tcm-primary-300);
}

.filter-btn.is-active {
  border-color: var(--tcm-jade-500);
  background: #E8F5E9;
  color: var(--tcm-jade-500);
  font-weight: 600;
}

/* ===== 草药卡片 ===== */
.herbs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding-bottom: 40px;
}

.herb-card {
  height: 320px;
  perspective: 800px;
  cursor: pointer;
}

.herb-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
  transform-style: preserve-3d;
}

.herb-card.is-flipped .herb-card-inner {
  transform: rotateY(180deg);
}

.herb-front,
.herb-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--tcm-radius-lg);
  border: 1px solid var(--tcm-border-light);
  background: var(--tcm-bg-surface);
  box-shadow: var(--tcm-shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.herb-back {
  transform: rotateY(180deg);
  padding: 16px;
  overflow-y: auto;
}

/* ===== 正面 ===== */
.herb-front {
  padding: 24px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* ===== 药材图片 ===== */
.herb-image-wrap {
  width: 100%;
  min-height: 100px;
  max-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  border-radius: var(--tcm-radius-md);
  overflow: hidden;
  background: var(--tcm-bg-base);
}

.herb-photo {
  width: 100%;
  height: 100%;
  max-height: 130px;
  object-fit: cover;
  display: block;
}

.herb-icon-fallback {
  width: 48px;
  height: 48px;
  opacity: 0.85;
}

.herb-icon-fallback :deep(svg) {
  width: 100%;
  height: 100%;
}

/* 保留旧样式以确保兼容 */
.herb-icon { width: 48px; height: 48px; margin: 0 auto 8px; opacity: 0.85; }
.herb-icon :deep(svg) { width: 100%; height: 100%; }
.herb-name-area {
  margin-bottom: 16px;
}

.herb-pinyin {
  display: block;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-disabled);
  font-style: italic;
  margin-bottom: 6px;
}

.herb-name {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-3xl);
  color: var(--tcm-text-primary);
  margin: 0;
}

.herb-front-cats {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 16px;
}

.herb-front-hint {
  font-size: var(--tcm-font-xs);
  color: var(--tcm-text-disabled);
  margin: 0;
}

/* ===== 背面 ===== */
.herb-back-name {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-lg);
  color: var(--tcm-text-primary);
  margin: 0 0 8px 0;
  text-align: center;
}

.herb-property {
  margin-bottom: 6px;
}

.prop-label {
  display: block;
  font-size: var(--tcm-font-xs);
  font-weight: 600;
  color: var(--tcm-jade-500);
  margin-bottom: 1px;
}

.prop-value {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}

.prop-caution {
  color: var(--tcm-red-500);
}

.herb-back-cats {
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .herbs-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .herb-card {
    height: 280px;
  }
}
</style>
