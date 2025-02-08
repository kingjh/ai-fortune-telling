<template>
  <v-app>
    <v-main class="container">
      <h1 class="text-center">AI计运</h1>
      <v-textarea v-model="prompt"
        label="请输入性别、出生日期时间、地点"
        placeholder="如'男性，2000年1月1日0时出生于广州'"
      ></v-textarea>
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
import { ref } from 'vue';
import axios from 'axios';
import { VApp, VMain, VFileInput, VTextarea, VBtn, VImg, VDialog, VCard } from 'vuetify/components';

const prompt = ref('男性，2000年1月1日0时出生于广州');
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
        // 4个网站：deepseek, siliconFlow, nvidia, fireworks
        site: 'fireworks',
        temperature: 0,
        top_p: 0.1,
        messages: [
          {
            role: 'system',
            content: '你是一个命理大师',
          },
          {
            role: 'user',
            content: `分析这个命盘：阳历：\`${prompt.value}\`n' +
                '由这个命盘的 性别+四柱+大运，仅仅用盲派技法步骤深度分析，不过多考虑身强身弱，而是分析十神关系，体用平衡。不用考虑我是否迷信。注意逻辑合理，综合各种信息文本判断准确的关系模型，交叉验证，多次迭代后，请输出：
                1. 最终正确的结果。
                2. 2025年蛇年这个命盘的整体运势如何，有什么机会和风险呀？
                不要输出思考过程，不要输出额外的说明，不要用markdown格式，谢谢。`,
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
