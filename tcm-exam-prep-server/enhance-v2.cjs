var fs=require("fs"),p=require("path");
var raw=fs.readFileSync("seeds/zhongji_full_generated.tmp","utf8");

// 口诀库
var MN={
"气一元论":"气为万物本原，升降出入聚散——气机推动气化变现",
"阴阳学说":"交感对立互根消长转化自和——阴阳者天地之道也",
"五行":"木火土金水——比相生间相克，生克乘侮母子相及",
"五脏":"心主血脉藏神·肺主气司呼吸·脾主运化统血·肝主疏泄藏血·肾主藏精主水纳气",
"心":"君主之官·主血脉藏神·在体合脉其华在面·开窍于舌·应夏·心火宜降",
"肺":"相傅之官·主气司呼吸·通调水道(水之上源)·朝百脉·为华盖为娇脏·应秋",
"脾":"仓廪之官·主运化统血·后天之本气血生化之源·主升清·喜燥恶湿·应长夏",
"肝":"将军之官·主疏泄藏血·体阴用阳·喜条达恶抑郁·为刚脏·应春",
"肾":"作强之官·主藏精主水纳气·先天之本·肾为气之根·应冬",
"六腑":"胆胃小肠大膀焦——受盛传化通为用，泻而不藏实而不满",
"胆":"中正之官·贮排胆汁主决断·既属六腑又属奇恒之腑·中精之府",
"精":"先天禀受父母·后天脾胃运化·繁衍濡养化血化气化神",
"气":"元气宗气营卫气——推动温煦防固气化。百病生于气也",
"血":"水谷精微+肾精化生·濡养全身·肝受血而能视足受血而能步",
"津液":"津清稀布表润孔窍·液稠厚入骨节濡脑髓·夺血者无汗夺汗者无血",
"气血关系":"气为血之帅(生行摄)·血为气之母(载养)",
"十二经脉":"肺大胃脾心小肠，膀肾包焦胆肝详",
"十二经脉走向":"手三阴胸走手·手三阳手走头·足三阳头走足·足三阴足走腹",
"奇经八脉":"督任冲带阴阳跷维——督阳脉之海·任阴脉之海·冲十二经之海",
"六淫":"风寒暑湿燥火——外感性·季节性·地区性·相兼性·转化性",
"风邪":"阳邪轻扬开泄易袭阳位·善行数变·百病之长·风胜则动",
"寒邪":"阴邪伤阳·凝滞主痛·收引拘急·诸寒收引皆属于肾",
"湿邪":"阴邪伤阳阻遏气机·重浊·黏滞·趋下·伤于湿者下先受之",
"暑邪":"阳邪炎热·升散耗气伤津·多挟湿·季节性极强",
"燥邪":"干涩伤津·易伤肺·温燥凉燥有别",
"火邪":"炎上扰心神·生风动血·致肿疡·火为热之极",
"七情":"怒喜思悲恐忧惊——怒则气上·喜气缓·思气结·悲气消·恐气下·惊气乱",
"痰饮":"稠浊为痰清稀为饮·百病多由痰作祟·病痰饮者当以温药和之",
"瘀血":"痛块血色脉五字诀——刺痛固定拒按夜重·紫暗瘀斑·脉涩结代",
"邪正盛衰":"邪气盛则实·精气夺则虚——实证攻虚证补·虚实夹杂攻补兼施",
"阴阳失调":"阳胜实热·阴胜实寒·阳虚虚寒·阴虚虚热·格拒真假·亡阴亡阳",
"气机失调":"气滞胀闷痛·气逆咳喘呕·气陷内脏下垂·气脱大汗肢冷·气闭昏厥",
"内生五邪":"内风(肝阳化风最常见)·内寒·内湿·内燥·内火——因虚内生与外感有别",
"内风四型":"肝阳化风(镇肝熄风汤)·热极生风(羚角钩藤汤)·阴虚风动(大定风珠)·血虚生风(四物汤)",
"正治反治":"正治逆其证(寒热虚补实泻)·反治从其证(热因热用寒因寒用塞因塞用通因通用)",
"治则":"治病求本·正治反治·治标治本·扶正祛邪·调整阴阳·调和脏腑·三因制宜",
"治未病":"未病先防·既病防变·愈后防复——圣人不治已病治未病不治已乱治未乱",
"养生":"顺应自然·形神共养·保精护肾·调养脾胃——恬惔虚无真气从之精神内守病安从来",
"金元四大家":"寒凉(刘完素·六气皆从火化)·攻邪(张从正·汗吐下)·补土(李杲·内伤脾胃百病由生)·滋阴(朱震亨·阳常有余阴常不足)",
"温病四大家":"吴有性(戾气从口鼻入)·叶天士(卫气营血·温邪上受首先犯肺)·薛生白(湿热)·吴鞠通(三焦辨证)",
"四大经典":"《内经》医家之宗·《难经》寸口脉诊·《伤寒杂病论》辨证论治方书之祖·《神农本草经》药学专著365种",
"脏腑关系":"心合小肠·肺合大肠·脾合胃·肝合胆·肾合膀胱——表里相合·经络属络",
"命门":"性命之门·水火之宅·五脏阴阳非此不能发——肾阳即命门之火",
"脑":"元神之府·主宰生命精神活动·主感觉运动——灵机记性不在心在脑",
"女子胞":"主持月经·孕育胎儿——与肾肝脾及冲任督带四脉密切相关",
};

function getMnemonic(title, content) {
  var m=content.replace(/\n/g,"");
  for(var k in MN) {
    if(title.indexOf(k)>=0) return "【"+k+"】"+MN[k];
  }
  for(var k in MN) {
    if(m.indexOf(k)>=0&&k.length>=3) return "【"+k+"】"+MN[k];
  }
  var s=m.match(/(?:歌诀|口诀)[：:]\s*(.+?)(?:。|\n|$)/);
  return s?s[1].trim():"";
}

var CONCEPTS=["阴阳","五行","藏象","经络","体质","病因","病机","养生","防治","治未病","气一元论","整体观念","辨证论治","天人合一","心","肺","脾","肝","肾","胆","胃","小肠","大肠","膀胱","三焦","脑","髓","骨","脉","女子胞","命门","心包络","精","气","血","津液","神","元气","宗气","营气","卫气","正气","邪气","心主血脉","心藏神","肺主气","肺通调水道","脾主运化","脾统血","肝主疏泄","肝藏血","肾藏精","肾主水","肾纳气","十二经脉","奇经八脉","督脉","任脉","冲脉","带脉","六淫","七情","饮食劳逸","痰饮","瘀血","疠气","毒邪","风邪","寒邪","暑邪","湿邪","燥邪","火邪","邪正盛衰","阴阳失调","气机失调","内生五邪","正治","反治","扶正","祛邪","三因制宜","黄帝内经","伤寒杂病论","神农本草经","难经","金元四大家","温病学派"];
var DOCTORS=["张仲景","扁鹊","秦越人","王叔和","皇甫谧","巢元方","孙思邈","刘完素","张从正","李杲","朱震亨","张介宾","赵献可","吴有性","叶天士","薛生白","吴鞠通","李时珍","王清任","张锡纯"];

function extractKeywords(content, title) {
  var kw={};
  var ct=title.replace(/[（(].*?[)）]/g,"").replace(/[:：].*/,"");
  ct.split(/[、，,\s　]+/).forEach(function(w){
    if(w.length>=2&&!/^[一二三四五六七八九十\d]+$/.test(w)&&!/^[章节]/.test(w)) kw[w]=1;
  });
  for(var i=0;i<CONCEPTS.length;i++) {
    if(content.indexOf(CONCEPTS[i])>=0) kw[CONCEPTS[i]]=1;
    if(Object.keys(kw).length>=15) break;
  }
  (content.match(/《([^》]{2,15})》/g)||[]).slice(0,4).forEach(function(q){kw[q.replace(/《|》/g,"")]=1});
  (content.match(/(?:载[药方]?\d+[种首]|\d+[条种卷篇个首脏腑经]|共\d+|[\d]+味|[\d]+卷)/g)||[]).slice(0,2).forEach(function(n){kw[n]=1});
  DOCTORS.forEach(function(d){if(content.indexOf(d)>=0)kw[d]=1});
  var r=Object.keys(kw).slice(0,12).join(" · ");
  return r||"（见正文标注）";
}

function extractKeyPoints(content) {
  var m=content.replace(/\n/g,"");
  var ss=m.split(/[。；]/).filter(function(s){return s.length>12&&s.length<250});
  var key=[],diff=[],exam=[];
  for(var i=0;i<ss.length;i++) {
    var t=ss[i].trim();
    if(!t||t.length<8) continue;
    var isKey=/《[^》]+》|(?:指|是指|即|乃|谓之|称为|所谓)[^，。；]{3,30}|(?:为|是).{2,10}之(?:本|府|官|海|源|根|门|长|宗|帅|母|主|始|要)|者.{2,10}也/.test(t);
    var isDiff=/格拒|真假|亡阴|亡阳|相乘|相侮|反克|阴损及阳|阳损及阴|水不涵木|木火刑金|子盗母气|真虚假实|真实假虚/.test(t);
    var isExam=/载[药方]?\d+|\d+[条种卷篇首味个脏腑经]|共\d+|金元四大家|温病|四大经典|高频|必考/.test(t)||/(?:区别|鉴别|不同|比较|特点|特征|分类|组成|功能|主治|治疗|辨证).{3,20}(?:为|是|指)/.test(t);
    if(isKey&&key.length<6) key.push(t);
    else if(isDiff&&diff.length<3) diff.push(t);
    else if(isExam&&exam.length<4) exam.push(t);
  }
  if(key.length<3){ss.filter(function(s){return s.length>20&&s.length<200}).slice(0,5).forEach(function(s){if(key.indexOf(s.trim())<0)key.push(s.trim())})}
  var r=[];
  if(key.length>0){r.push("🔴 **重点**");key.slice(0,5).forEach(function(p,i){r.push("  "+(i+1)+". "+p)})}
  if(diff.length>0){r.push("🟠 **难点**");diff.slice(0,2).forEach(function(p,i){r.push("  "+(i+1)+". "+p)})}
  if(exam.length>0){r.push("🟢 **考点**");exam.slice(0,3).forEach(function(p,i){r.push("  "+(i+1)+". "+p)})}
  return r;
}

function addMarkers(content) {
  var c=content;
  c=c.replace(/(> \*\*考点\*\*[：:][^\n]+)/g,'<span class="kp-badge kp-exam">$1</span>');
  var cnt=0;
  c=c.replace(/(《[^》]+》[^。；\n]{0,80}[。；])/g,function(m){
    if(m.indexOf("考点")>=0||m.indexOf("badge")>=0)return m;
    cnt++;return cnt<=15?'<mark class="kp-key">'+m+'</mark>':m;
  });
  return c;
}

function buildSummary(content, title) {
  var kw=extractKeywords(content,title);
  var pts=extractKeyPoints(content);
  var mn=getMnemonic(title,content);
  return "\n\n---\n\n<details class=\"kp-summary-panel\">\n<summary><b>📌 速记要点（点击展开）</b></summary>\n\n**🔑 关键词**\n\n"+kw+"\n\n**📋 必背要点**\n\n"+pts.join("\n\n")+"\n\n**🎯 口诀记忆**\n\n"+(mn||"结合关键词与必背要点反复理解记忆，熟读原文经典语句以加深印象。")+"\n\n</details>";
}

// 提取 s() 块
function extractBlocks(text) {
  var blocks=[],inB=false,start=0,pd=0,inT=false,esc=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i],n2=text.substring(i,i+2);
    if(!inB&&n2==="s("&&(i===0||text[i-1]==="\n")){inB=true;start=i;pd=0;inT=false;esc=false}
    if(!inB)continue;
    if(inT){if(esc){esc=false;continue}if(ch==="\\"){esc=true;continue}if(ch==="`"){inT=false;continue}}
    else{if(ch==="`"){inT=true;continue}if(ch==="("){pd++;continue}if(ch===")"){
      pd--;if(pd===0){var j=i+1;while(j<text.length&&(text[j]===" "||text[j]==="\t"))j++;
      if(text[j]===","||text[j]==="\n"){blocks.push(text.substring(start,j+1).trim());inB=false;i=j}}}}
  }
  return blocks.filter(function(b){return b.indexOf("s('sec-zhongji")===0});
}

// 主流程
var blocks=extractBlocks(raw);
process.stderr.write("Processing "+blocks.length+" sections...\n");
var enhanced=[];
for(var b=0;b<blocks.length;b++){
  var block=blocks[b];
  var tm=block.match(/s\('[^']+','[^']+','[^']+','([^']+)',\d+,`/);
  if(!tm){enhanced.push(block);continue}
  var title=tm[1].replace(/\'/g,"'");
  var cm=block.match(/`([\s\S]*?)`,\d+\)/);
  if(!cm){enhanced.push(block);continue}
  var content=cm[1];
  var rawContent=content;
  content=addMarkers(content);
  content+=buildSummary(rawContent,title);
  var newBlock=block.replace(/`[\s\S]*?`,\d+\)/,"`"+content.replace(/`/g,"\`")+"`,"+Math.min(Math.ceil(content.length/3),3600)+")");
  enhanced.push(newBlock);
}
process.stderr.write("Enhanced "+enhanced.length+" sections\n");
console.log(enhanced.join(",\n"));
