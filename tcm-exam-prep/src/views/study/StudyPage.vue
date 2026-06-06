<template>
  <div class="page-study">
    <div class="page-header">
      <h1 class="page-title">对比学习</h1>
      <p class="page-subtitle">通过对比相似知识点，加深理解，避免混淆 -- 中医执业助理医师考试必备技能</p>
    </div>

    <!-- Comparison Selector -->
    <div class="comparison-selector">
      <button
        v-for="group in comparisonGroups"
        :key="group.id"
        class="selector-btn"
        :class="{ 'selector-btn--active': activeGroup === group.id }"
        @click="activeGroup = group.id"
      >
        {{ group.label }}
      </button>
    </div>

    <!-- Active Comparison -->
    <div class="comparison-content">
      <TcmCard :title="activeComparison.title" class="comparison-card">
        <template #header>
          <div class="comparison-desc">{{ activeComparison.description }}</div>
        </template>

        <CompareTable
          :headers="activeComparison.headers"
          :rows="activeComparison.rows"
          :highlight-column="activeComparison.highlightColumn"
        />
      </TcmCard>

      <!-- Key Points Summary -->
      <div v-if="activeComparison.keyPoints" class="key-points">
        <h3 class="kp-title">记忆要点</h3>
        <ul class="kp-list">
          <li v-for="(point, i) in activeComparison.keyPoints" :key="i" class="kp-item">
            {{ point }}
          </li>
        </ul>
      </div>

      <!-- Exam Tips -->
      <div v-if="activeComparison.examTips" class="exam-tips">
        <h3 class="tips-title">&#x1F4DD; 考试提示</h3>
        <p class="tips-text">{{ activeComparison.examTips }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TcmCard from '@/components/ui/TcmCard.vue'
import CompareTable from '@/components/common/CompareTable.vue'

interface ComparisonGroup {
  id: string
  label: string
  title: string
  description: string
  headers: string[]
  rows: string[][]
  highlightColumn?: number
  keyPoints: string[]
  examTips: string
}

const activeGroup = ref('fengre-fengshi')

const comparisonGroups = computed<{ id: string; label: string }[]>(() => [
  { id: 'fenghan-fengre', label: '风寒感冒 vs 风热感冒' },
  { id: 'mahuang-guizhi', label: '麻黄汤 vs 桂枝汤' },
  { id: 'huanglian-series', label: '黄芩 vs 黄连 vs 黄柏' },
  { id: 'sijun-siwu-bazhen', label: '四君子汤 vs 四物汤 vs 八珍汤' },
  { id: 'hegu-taichong', label: '合谷 vs 太冲' },
])

const activeComparison = computed<ComparisonGroup>(() => {
  const map: Record<string, ComparisonGroup> = {
    'fenghan-fengre': {
      id: 'fenghan-fengre',
      label: '风寒感冒 vs 风热感冒',
      title: '风寒感冒 vs 风热感冒',
      description: '感冒是中医执业考试高频考点，准确区分风寒与风热是辨证论治的第一步。',
      headers: ['对比项', '风寒感冒', '风热感冒'],
      highlightColumn: 0,
      rows: [
        ['病因', '外感风寒之邪，以风邪为主，兼夹寒邪。多见于冬春季', '外感风热之邪，以风邪为主，兼夹热邪。多见于春夏或秋季'],
        ['恶寒发热', '恶寒重，发热轻', '发热重，恶风（恶寒轻）'],
        ['汗出', '无汗', '有汗或少汗'],
        ['头痛', '头痛身痛，痛势较重', '头胀痛，痛势较轻'],
        ['鼻部症状', '鼻塞，流清涕', '鼻塞，流浊涕或黄涕'],
        ['咽喉', '咽不痛或微痛，不红不肿', '咽喉肿痛，咽红充血'],
        ['咳嗽', '咳嗽，痰白稀薄', '咳嗽，痰黄黏稠'],
        ['口渴', '口不渴或喜热饮', '口渴，喜冷饮'],
        ['舌象', '舌苔薄白或白润', '舌苔薄黄，舌尖红'],
        ['脉象', '脉浮紧', '脉浮数'],
        ['治法', '辛温解表，宣肺散寒', '辛凉解表，清宣肺热'],
        ['代表方', '荆防败毒散', '银翘散'],
      ],
      keyPoints: [
        '恶寒与发热的轻重关系是鉴别关键：恶寒重发热轻属风寒，发热重恶寒轻属风热',
        '舌脉是客观指标：舌苔薄白+脉浮紧为风寒，舌苔薄黄+脉浮数为风热',
        '咽部症状：咽不痛为风寒，咽红肿痛为风热',
        '涕痰性质：清稀白为风寒，黄稠浊为风热',
      ],
      examTips: '考试中常以"病例分析"题型出现，题干中恶寒发热关系、舌脉描述是解题关键。注意风寒感冒表实证用荆防败毒散，表虚证用桂枝汤，不可混淆。',
    },
    'mahuang-guizhi': {
      id: 'mahuang-guizhi',
      label: '麻黄汤 vs 桂枝汤',
      title: '麻黄汤 vs 桂枝汤',
      description: '同为辛温解表剂，均出自《伤寒论》，为太阳病代表方。两者主治证候截然不同，是方剂学考试必考内容。',
      headers: ['对比项', '麻黄汤', '桂枝汤'],
      highlightColumn: 0,
      rows: [
        ['出处', '《伤寒论》', '《伤寒论》'],
        ['组成', '麻黄 三两, 桂枝 二两, 杏仁 七十个, 炙甘草 一两', '桂枝 三两, 芍药 三两, 生姜 三两, 大枣 十二枚, 炙甘草 二两'],
        ['君臣佐使', '君:麻黄发汗解表; 臣:桂枝助麻黄发汗; 佐:杏仁降肺气; 使:炙甘草调和', '君:桂枝解肌发表; 臣:芍药敛阴和营; 佐:生姜助桂枝,大枣助芍药; 使:炙甘草调和'],
        ['功效', '发汗解表，宣肺平喘', '解肌发表，调和营卫'],
        ['主治', '外感风寒表实证（太阳伤寒证）', '外感风寒表虚证（太阳中风证）'],
        ['病机', '风寒外束，卫阳被遏，营阴郁滞，肺气不宣', '风寒客表，营弱卫强，营卫不和'],
        ['辨证要点', '恶寒发热，无汗而喘，脉浮紧', '恶风发热，汗出，脉浮缓'],
        ['恶寒发热', '恶寒明显，发热较重', '恶风（遇风则冷），发热较轻'],
        ['汗出', '无汗（辨证关键）', '自汗出（辨证关键）'],
        ['脉象', '脉浮紧有力', '脉浮缓或浮弱'],
        ['兼证', '喘咳，身痛，骨节疼痛', '鼻鸣干呕，项背强急'],
        ['使用注意', '表虚自汗、外感风热、阴血亏虚者忌用；体虚慎用', '表实无汗、温热病、阳热亢盛者忌用'],
        ['配伍特点', '麻桂相须为用，发汗力猛，为峻汗剂', '桂芍相配，一散一收，调和营卫，发汗力缓'],
      ],
      keyPoints: [
        '辨证核心：麻黄汤 = 恶寒发热 + 无汗而喘 + 脉浮紧 (表实证)',
        '辨证核心：桂枝汤 = 恶风发热 + 汗出 + 脉浮缓 (表虚证)',
        '配伍精髓：麻黄协桂枝发汗力强；桂枝配芍药散收结合',
        '桂枝汤不仅解表，更是"群方之冠"，调和营卫的基础方',
        '麻黄汤为"发汗峻剂"，中病即止，不可过服',
      ],
      examTips: '考试重点考查两方的辨证要点和配伍特点。典型的病例题会通过"有无汗出"和脉象来区分。须掌握麻黄汤去桂枝名"三拗汤"的临证变通规律。',
    },
    'huanglian-series': {
      id: 'huanglian-series',
      label: '黄芩 vs 黄连 vs 黄柏',
      title: '黄芩 vs 黄连 vs 黄柏',
      description: '三药均属清热燥湿药，性味均为苦寒，但归经与主治各有侧重 -- "黄芩治上焦，黄连治中焦，黄柏治下焦"是经典总结。',
      headers: ['对比项', '黄芩', '黄连', '黄柏'],
      highlightColumn: 0,
      rows: [
        ['性味', '苦，寒', '苦，寒', '苦，寒'],
        ['归经', '归肺、胆、脾、大肠、小肠经', '归心、肝、胃、大肠经', '归肾、膀胱、大肠经'],
        ['清热定位', '善清上焦肺热及少阳胆热', '善清中焦湿热及心胃火', '善清下焦湿热及肾中虚火'],
        ['功效共性', '清热燥湿，泻火解毒', '清热燥湿，泻火解毒', '清热燥湿，泻火解毒'],
        ['特有功效', '止血（炒炭），安胎', '（无）', '退虚热，除骨蒸'],
        ['肺热咳嗽', '首选，清泻肺火', '（非适应）', '（非适应）'],
        ['湿热泻痢', '配伍（与黄连常同用）', '首选，善清胃肠湿热', '（非适应）'],
        ['心火亢盛', '（力弱）', '首选，善清心经实火', '（非适应）'],
        ['胃火牙痛', '（力弱）', '善清胃火', '（非适应）'],
        ['下焦湿热（淋证、带下）', '（非适应）', '（力弱）', '首选'],
        ['阴虚发热', '（非主治）', '（非主治）', '善退虚热，除骨蒸潮热'],
        ['炮制变化', '生用清热；炒炭止血；酒炒上行清肺', '生用清心胃；姜制止呕；酒制上行清头目', '生用清热燥湿；盐炙入肾退虚热'],
        ['代表方', '小柴胡汤（清少阳胆热）', '黄连解毒汤（泻火解毒）', '知柏地黄丸（滋阴降火）'],
      ],
      keyPoints: [
        '记忆口诀：黄芩上焦肺，黄连中焦心胃，黄柏下焦肾',
        '黄芩特色：止血安胎；黄连特色：清心胃火最专；黄柏特色：退虚热无可替代',
        '三药均治湿热泻痢：黄芩配黄连（如葛根芩连汤），黄柏多用于湿热下注之痢疾',
        '黄连为清热燥湿药中药力最强、应用最广之品',
      ],
      examTips: '考试常以"三黄"的功效异同为考点，尤其是归经侧重的区分。选择题常见"下列哪项是黄连的功效而不属于黄芩"等类型。注意黄柏退虚热是区别于芩、连的关键考点。',
    },
    'sijun-siwu-bazhen': {
      id: 'sijun-siwu-bazhen',
      label: '四君子汤 vs 四物汤 vs 八珍汤',
      title: '四君子汤 vs 四物汤 vs 八珍汤',
      description: '四君子汤是补气基础方，四物汤是补血基础方，八珍汤是气血双补代表方。掌握其中衍化关系对学习方剂学至关重要。',
      headers: ['对比项', '四君子汤', '四物汤', '八珍汤'],
      highlightColumn: 0,
      rows: [
        ['分类', '补气剂 (补气基础方)', '补血剂 (补血调血基础方)', '气血双补剂'],
        ['组成', '人参, 白术, 茯苓, 炙甘草 (各等分)', '熟地黄, 当归, 白芍, 川芎 (各等分)', '人参, 白术, 茯苓, 炙甘草, 熟地黄, 当归, 白芍, 川芎'],
        ['功效', '益气健脾', '补血和血，调经', '益气补血'],
        ['主治', '脾胃气虚证', '营血虚滞证 / 冲任虚损证', '气血两虚证'],
        ['典型症状', '面色萎白，气短乏力，食少便溏，舌淡苔白，脉虚弱', '面色萎黄，头晕眼花，心悸失眠，月经不调，舌淡脉细', '面色苍白无华，头晕目眩，四肢倦怠，气短懒言，饮食减少'],
        ['病机要点', '脾胃气虚，运化乏力，气血生化不足', '营血亏虚，血行不畅，冲任失养', '气虚与血虚并见，脾虚生化无源'],
        ['方解 (君药)', '人参 — 大补脾胃之气', '熟地黄 — 滋阴补血，填精益髓', '人参 + 熟地黄 — 益气补血并行'],
        ['方解 (臣药)', '白术 — 健脾燥湿', '当归 — 补血活血，调经止痛', '白术 + 当归 — 助君益气补血'],
        ['配伍特点', '补中有泻（茯苓利湿），补而不滞', '补血兼行（川芎活血），补而不滞，行而不破', '四君子 + 四物汤合方，气血同补'],
        ['衍生方', '六君子汤(+陈皮半夏)、香砂六君子汤', '桃红四物汤(+桃仁红花)、圣愈汤', '十全大补汤(+黄芪肉桂)、人参养荣汤'],
        ['与脏腑关系', '重在补脾之气', '重在养肝之血', '脾肝同补，气血互生'],
      ],
      keyPoints: [
        '四君子汤（补气）+ 四物汤（补血）= 八珍汤（气血双补）',
        '八珍汤 + 黄芪、肉桂 = 十全大补汤（温补气血）',
        '四君子汤歌诀："四君子汤中和义，参术茯苓甘草比"',
        '四物汤歌诀："四物地芍与归芎，血家百病此方通"',
        '气为血之帅，血为气之母 -- 气血双补理论体现了气血互生互用的中医核心思想',
      ],
      examTips: '考试常考查方剂之间的衍化关系。重点记忆"四君子补气，四物补血，八珍双补"的主线，以及各方的君药和配伍特点。还需掌握各衍生方的加味变化和适应证。',
    },
    'hegu-taichong': {
      id: 'hegu-taichong',
      label: '合谷 vs 太冲',
      title: '合谷 vs 太冲 (开四关)',
      description: '"面口合谷收，头项寻列缺"。合谷与太冲合称"四关穴"，一上一下，一气一血，一阳一阴，是针灸学最经典的配伍组合之一。',
      headers: ['对比项', '合谷 (LI4)', '太冲 (LR3)'],
      highlightColumn: 0,
      rows: [
        ['所属经络', '手阳明大肠经', '足厥阴肝经'],
        ['穴位类别', '原穴', '原穴 / 输穴'],
        ['定位', '手背第1、2掌骨之间，约第2掌骨桡侧中点处', '足背第1、2跖骨结合部之前凹陷中'],
        ['简便取穴', '以一手拇指指横纹放于另一手拇食指间指蹼缘上，拇指尖尽处', '足背第1、2趾间向上推至跖骨结合部前凹陷'],
        ['气血属性', '主气 (阳明经多气多血, 以气为主)', '主血 (厥阴经多血少气, 以血为主)'],
        ['阴阳属性', '属阳 (阳经原穴)', '属阴 (阴经原穴)'],
        ['功效', '镇静止痛，通经活络，清热解表', '平肝息风，疏肝理气，调经止带'],
        ['主治', '头痛、牙痛、面瘫、面肌痉挛、发热无汗、上肢不遂、经闭', '头痛眩晕、高血压、中风、癫痫、胁痛、月经不调、痛经'],
        ['针刺方法', '直刺0.5-1寸；孕妇禁针', '直刺0.5-0.8寸'],
        ['特殊禁忌', '孕妇禁用合谷 (有催产作用)', '无明显禁忌'],
        ['配伍名称', '"四关穴" 之 "气关"', '"四关穴" 之 "血关"'],
        ['配伍意义', '合谷在上调气，太冲在下调血，气血同调', '合谷属阳主升散，太冲属阴主降泄，升降相因'],
      ],
      keyPoints: [
        '"面口合谷收" -- 合谷善治头面五官诸疾，为"四总穴"之一',
        '"开四关"指合谷配太冲，用于镇静安神、行气活血、解郁止痛',
        '合谷主气，太冲主血；合谷调气分之病，太冲理血分之疾',
        '孕妇禁针合谷 -- 此为针灸学最重要的安全禁忌之一',
        '合谷泻法可发汗解表，补法可固表止汗，体现了双向调节作用',
      ],
      examTips: '考试重点："四总穴歌"中的"面口合谷收"是必考内容。合谷配太冲（开四关）的配伍原理是高频考点。注意合谷归经是大肠经而非肺经，虽治疗表证但并非肺经穴位。孕妇禁针合谷是针灸安全的经典考点。',
    },
  }
  return map[activeGroup.value] ?? map['fenghan-fengre']
})
</script>

<style scoped>
.page-study { /* 宽度动态填充 */ }

.page-header { text-align: center; padding: 24px 0 20px; }
.page-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-3xl);
  color: var(--tcm-primary-500);
  margin-bottom: 8px;
}
.page-subtitle { color: var(--tcm-text-secondary); font-size: var(--tcm-font-sm); max-width: 560px; margin: 0 auto; line-height: var(--tcm-leading-relaxed); }

/* Selector */
.comparison-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 6px;
  flex-wrap: wrap;
}
.selector-btn {
  padding: 8px 18px;
  border: 1px solid var(--tcm-border);
  border-radius: var(--tcm-radius-md);
  background: var(--tcm-bg-surface);
  color: var(--tcm-text-secondary);
  font-size: var(--tcm-font-sm);
  font-family: var(--tcm-font-family);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--tcm-transition-fast);
}
.selector-btn:hover {
  border-color: var(--tcm-primary-300);
  color: var(--tcm-primary-500);
}
.selector-btn--active {
  background: var(--tcm-primary-500);
  color: #fff;
  border-color: var(--tcm-primary-500);
}

/* Comparison */
.comparison-content { margin-bottom: 40px; }
.comparison-card { margin-bottom: 24px; }
.comparison-desc {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}

/* Key Points */
.key-points {
  margin-top: 20px;
  padding: 20px;
  background: var(--tcm-bg-surface);
  border: 1px solid var(--tcm-border-light);
  border-radius: var(--tcm-radius-lg);
}
.kp-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-md);
  color: var(--tcm-primary-500);
  margin-bottom: 12px;
}
.kp-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.kp-item {
  padding: 8px 12px 8px 24px;
  position: relative;
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-primary);
  line-height: var(--tcm-leading-relaxed);
  background: var(--tcm-bg-base);
  border-left: 3px solid var(--tcm-gold-300);
  border-radius: 0 var(--tcm-radius-sm) var(--tcm-radius-sm) 0;
}
.kp-item::before {
  content: '\25C6';
  position: absolute;
  left: 6px;
  top: 8px;
  font-size: 8px;
  color: var(--tcm-gold-500);
}

/* Exam Tips */
.exam-tips {
  margin-top: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7);
  border: 1px solid var(--tcm-gold-300);
  border-radius: var(--tcm-radius-lg);
}
.tips-title {
  font-family: var(--tcm-font-decorative);
  font-size: var(--tcm-font-md);
  color: var(--tcm-gold-700);
  margin-bottom: 8px;
}
.tips-text {
  font-size: var(--tcm-font-sm);
  color: var(--tcm-text-secondary);
  line-height: var(--tcm-leading-relaxed);
}

@media (max-width: 768px) {
  .comparison-selector { gap: 6px; }
  .selector-btn { padding: 6px 12px; font-size: var(--tcm-font-xs); }
  .key-points { padding: 14px; }
  .exam-tips { padding: 12px 16px; }
}
</style>
