<template>
  <v-app>
    <v-main class="container">
      <h1 class="text-center">AI计运</h1>
      
      <v-select
        v-model="gender"
        :items="genderOptions"
        label="性别"
        class="mb-4"
      ></v-select>

      <v-row>
        <v-col>
          <v-text-field
            v-model="birthDate"
            type="date"
            label="出生日期"
            :max="new Date().toISOString().split('T')[0]"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            v-model="birthTime"
            type="time"
            label="出生时间"
          ></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            v-model="selectedProvince"
            :items="provinces"
            label="省份"
            class="mb-4"
            @update:model-value="handleProvinceChange"
          ></v-select>
        </v-col>
        <v-col>
          <v-select
            v-model="selectedCity"
            :items="availableCities"
            label="城市"
            class="mb-4"
            :disabled="!selectedProvince"
          ></v-select>
        </v-col>
      </v-row>

      <div>
        <v-btn
            color="primary"
            @click="generateConclusion"
            :disabled="loading"
            class="generate-button"
        >{{ loading ? `持续写了${elapsedTime}秒` : '推算！' }}</v-btn>
        <div v-if="conclusion" class="composition-text mt-12 mb-8">{{ conclusion }}</div>
        <v-btn
            v-if="conclusion"
            color="secondary"
            @click="copyConclusion"
            class="copy-button"
        >复制文本</v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { VApp, VMain, VFileInput, VTextarea, VBtn, VImg, VDialog, VCard } from 'vuetify/components';

const gender = ref('男');
const genderOptions = ['男', '女'];
const birthDate = ref(new Date().toISOString().split('T')[0]);
const birthTime = ref('06:00');
const selectedProvince = ref('广东');
const selectedCity = ref('广州');

const formattedDateTime = computed(() => {
  if (!birthDate.value) return '';
  const [year, month, day] = birthDate.value.split('-');
  return `${year}年${month}月${day}日`;
});

const prompt = computed(() => {
  return `${gender.value}性，${formattedDateTime.value}${birthTime.value}时出生于${selectedCity.value}`;
});

const conclusion = ref('');
const loading = ref(false);
const elapsedTime = ref(0);
let timerInterval = null;

function removeTags(input) {
  return input.replace(/<reasoning>.*?<\/reasoning>|<think>.*?<\/think>/gs, '').trim();
}

const conclude = async () => {
  try {
    const response = await axios.post(
      'https://dsai.cfworker.cfd/',
      {
        // 5个网站：deepseek, siliconFlow, nvidia, fireworks，huoshan
        site: 'huoshan',
        temperature: 0,
        top_p: 0.1,
        messages: [
          {
            role: 'user',
            content: `
分析这个命盘：阳历：\`${prompt.value}\`
根据"排大运分阳年、阴年。阳年：甲丙戊庚王。阴年：乙丁已辛癸，阳年男，阴年女为顺排，阴年男，阳年女为逆排，具体排法以月干支为基准，进行顺逆，小孩交大运前，以月柱干支为大运十天干：甲乙丙丁戊已庚辛壬癸，十二地支：子丑寅卯辰已午未申酉戌亥。"
根据"1924年2月15日为甲子日"，按照六十组干支循环每天递增，再将命盘里的生日与参考日相隔的天数取余数（模60）来确定日柱。
根据"时干 = (日干序数 × 2 + 时支序数 – 2) mod 10"，确定时干。
你现在是一个中国传统八字命理的专业研究人员。你熟读穷通宝典，三命通会，滴天髓，渊海子平这些书籍。你熟读千里命稿，协纪辨方书，果老星宗，子平真栓，神峰通考一系列书籍。
根据以上我所提到的书籍，及相关四柱八字的书籍和经验，对命盘的八字进行分析，内容越全面越好。
仅仅用盲派技法步骤深度分析，不过多考虑身强身弱，而是分析十神关系，体用平衡。不用考虑我是否迷信。注意逻辑合理，综合各种信息文本判断准确的关系模型，交叉验证，多次迭代后推算得出最终正确的结果，根据这个结果推算出该命盘已发生的历史事件。
请用纯文本输出以下内容，不要使用任何Markdown格式，不使用#、*、\`、-等符号，不要输出思考过程，不要输出额外的说明：
1.命盘的生辰八字。
2.推算的结果。
3.推算的历史事件。
4.2025年蛇年这个命盘的整体运势如何，有什么机会和风险呀？请细分到每个月。
`
          },
        ],
      },
      { timeout: 600000 }
    );
    return removeTags(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error rewriting description:', error);
    return '推算失败，请稍后重试。';
  }
};

const generateConclusion = async () => {
  loading.value = true;
  elapsedTime.value = 0;
  timerInterval = setInterval(() => {
    elapsedTime.value++;
  }, 1000);
  conclusion.value = await conclude();
  loading.value = false;
  clearInterval(timerInterval);
};

const copyConclusion = () => {
  const textarea = document.createElement('textarea');
  textarea.value = conclusion.value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = 0;
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const successful = document.execCommand('copy');
    if (successful) {
      alert('结论已复制到剪贴板！');
    } else {
      alert('复制失败，请手动复制结论内容。');
    }
  } catch (err) {
    console.error('复制文本时发生错误:', err);
    alert('复制文本时发生未知错误，请手动复制。');
  } finally {
    document.body.removeChild(textarea);
  }
};

// 省市数据
const locationData = {
  '北京': ['北京'],
  '天津': ['天津'],
  '河北': ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  '山西': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '内蒙古': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布'],
  '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '吉林': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城'],
  '黑龙江': ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化'],
  '上海': ['上海'],
  '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '安徽': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '巢湖', '六安', '亳州', '池州', '宣城'],
  '福建': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '江西': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '山东': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '莱芜', '临沂', '德州', '聊城', '滨州', '菏泽'],
  '河南': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '济源'],
  '湖北': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施', '仙桃', '潜江', '天门', '神农架'],
  '湖南': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西', '张家界', '湘西土家族苗族自治州'],
  '广东': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '茂名', '肇庆', '江门', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '广西': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
};

const provinces = computed(() => {
  return Object.keys(locationData);
});

const availableCities = computed(() => {
  return locationData[selectedProvince.value] || [];
});

const handleProvinceChange = () => {
  selectedCity.value = availableCities.value[0];
};

</script>

<style scoped>
.container {
  gap: 20px;
  padding: 20px;
}

.generate-button,
.copy-button,
.file-input {
  font-size: 1rem;
  border-radius: 4px;
}

.generate-button,
.copy-button {
  display: block;
  margin: auto;
}

.composition-text {
  padding: 20px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
  line-height: 1.6;
}

.thumbnail-container {
  margin-top: 10px;
  cursor: pointer;
  gap: 8px;
}

:deep(.v-responsive__sizer) {
  width: 100px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
