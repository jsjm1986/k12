// DOM 元素
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessage');
const toggleSettingsButton = document.getElementById('toggleSettings');
const settingsPanel = document.querySelector('.settings-panel');
const saveSettingsButton = document.getElementById('saveSettings');

// 家长设置相关DOM元素
const parentSettingsPanel = document.querySelector('.parent-settings-panel');
const toggleParentSettingsButton = document.getElementById('toggleParentSettings');
const parentAuthSection = document.querySelector('.parent-auth');
const parentSettingsContent = document.querySelector('.parent-settings-content');
const parentLoginButton = document.getElementById('parentLogin');
const parentLogoutButton = document.getElementById('parentLogout');
const saveParentSettingsButton = document.getElementById('saveParentSettings');

// 家长设置状态
let isParentLoggedIn = false;
const DEFAULT_PARENT_PASSWORD = 'cy.waryts.com'; // 更新默认密码

// 初始化设置
let currentSettings = getCurrentSettings();

// 添加新的DOM元素引用
const overlay = document.querySelector('.overlay');
const closeBtn = document.querySelector('.close-btn');

// 语音相关变量
const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceOutputBtn = document.getElementById('voiceOutputBtn');
const voiceStatus = document.getElementById('voiceStatus');
let isListening = false;
let isSpeaking = false;
let speechRecognition = null;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// 初始化语音识别
function initSpeechRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = 'zh-CN';
        speechRecognition.continuous = false;
        speechRecognition.interimResults = false;

        // 语音识别结果处理
        speechRecognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            userInput.value = result;
            stopListening();
            handleSendMessage();
        };

        // 错误处理
        speechRecognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            stopListening();
            alert('语音识别出错，请重试或使用键盘输入');
        };

        // 结束处理
        speechRecognition.onend = () => {
            stopListening();
        };

        return true;
    } catch (error) {
        console.error('浏览器不支持语音识别:', error);
        return false;
    }
}

// 开始语音识别
function startListening() {
    if (!speechRecognition && !initSpeechRecognition()) {
        alert('您的浏览器不支持语音识别功能');
        return;
    }

    try {
        speechRecognition.start();
        isListening = true;
        voiceInputBtn.classList.add('active');
        voiceStatus.classList.add('active');
        
        // 添加波纹动画
        const waves = document.createElement('div');
        waves.className = 'voice-waves';
        for (let i = 0; i < 5; i++) {
            waves.appendChild(document.createElement('div')).className = 'wave';
        }
        voiceInputBtn.appendChild(waves);
    } catch (error) {
        console.error('启动语音识别失败:', error);
        stopListening();
    }
}

// 停止语音识别
function stopListening() {
    if (speechRecognition) {
        try {
            speechRecognition.stop();
        } catch (error) {
            console.error('停止语音识别失败:', error);
        }
    }
    
    isListening = false;
    voiceInputBtn.classList.remove('active');
    voiceStatus.classList.remove('active');
    
    // 移除波纹动画
    const waves = voiceInputBtn.querySelector('.voice-waves');
    if (waves) {
        waves.remove();
    }
}

// 语音朗读文本
function speakText(text, messageElement) {
    if (isSpeaking) {
        stopSpeaking();
        return;
    }

    if (!speechSynthesis) {
        alert('您的浏览器不支持语音合成功能');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 开始朗读时的处理
    utterance.onstart = () => {
        isSpeaking = true;
        voiceOutputBtn.classList.add('active');
        if (messageElement) {
            messageElement.classList.add('speaking');
        }
    };

    // 结束朗读时的处理
    utterance.onend = () => {
        isSpeaking = false;
        voiceOutputBtn.classList.remove('active');
        if (messageElement) {
            messageElement.classList.remove('speaking');
        }
        currentUtterance = null;
    };

    // 错误处理
    utterance.onerror = (event) => {
        console.error('语音合成错误:', event);
        stopSpeaking();
        alert('语音��读出错，请重试');
    };

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

// 停止语音朗读
function stopSpeaking() {
    if (speechSynthesis && isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        voiceOutputBtn.classList.remove('active');
        document.querySelectorAll('.message.speaking').forEach(msg => {
            msg.classList.remove('speaking');
        });
        currentUtterance = null;
    }
}

// 修改添加消息函数，优化消息显示
async function addMessage(sender, text, isStream = false) {
    // 检查是否已存在相同内容的消息
    const existingMessages = document.querySelectorAll('.message');
    for (let msg of existingMessages) {
        const content = msg.querySelector('.message-content').textContent;
        if (content === text) {
            return; // 如果存在相同内容的消息，则不添加
        }
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // 如果是AI消息且需要流式输出
    if (sender === 'ai' && isStream) {
        content.textContent = '';
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        
        // 逐字显示文本
        const words = text.split('');
        for (let i = 0; i < words.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            content.textContent += words[i];
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // 添加朗读按钮
        if (text.trim().length > 0) { // 只在有实际内容时添加朗读按钮
            const speakButton = document.createElement('button');
            speakButton.className = 'speak-button';
            speakButton.innerHTML = '🔊';
            speakButton.title = '朗读消息';
            speakButton.onclick = () => speakText(text, messageDiv);
            content.appendChild(speakButton);
        }
    } else {
        // 普通消息直接显示
        content.textContent = text;
        if (sender === 'ai' && text.trim().length > 0) {
            const speakButton = document.createElement('button');
            speakButton.className = 'speak-button';
            speakButton.innerHTML = '🔊';
            speakButton.title = '朗读消息';
            speakButton.onclick = () => speakText(text, messageDiv);
            content.appendChild(speakButton);
        }
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
    }
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 清除思考中的消息
    const thinkingMessages = document.querySelectorAll('.message.ai.thinking');
    thinkingMessages.forEach(msg => msg.remove());
    
    return messageDiv;
}

// 语音按钮事件监听
voiceInputBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

voiceOutputBtn.addEventListener('click', () => {
    const lastAiMessage = chatMessages.querySelector('.message.ai:last-child');
    if (lastAiMessage) {
        const text = lastAiMessage.querySelector('.message-content').textContent;
        speakText(text, lastAiMessage);
    }
});

// 在页面关闭时停止所有语音活动
window.addEventListener('beforeunload', () => {
    stopListening();
    stopSpeaking();
});

// 初始化语音功能
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
});

// 家长登录处理
function handleParentLogin() {
    const password = document.getElementById('parentPassword').value;
    const savedPassword = localStorage.getItem('parentPassword') || DEFAULT_PARENT_PASSWORD;
    
    if (password === savedPassword) {
        isParentLoggedIn = true;
        parentAuthSection.style.display = 'none';
        parentSettingsContent.style.display = 'block';
        loadParentSettings();
        initTabs(); // 初始化标签页
    } else {
        alert('密码错误，请重试！');
    }
}

// 家长退出登录
function handleParentLogout() {
    isParentLoggedIn = false;
    parentAuthSection.style.display = 'block';
    parentSettingsContent.style.display = 'none';
    document.getElementById('parentPassword').value = '';
    
    // 关闭面板和遮罩层
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    parentPanel.classList.remove('active');
    setTimeout(() => {
        parentPanel.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

// 加载家长设置
function loadParentSettings() {
    const settings = getCurrentSettings().parentalSettings;
    
    // 基础设置
    document.getElementById('studentAge').value = settings.studentAge;
    document.getElementById('learningStyle').value = settings.learningStyle;
    document.getElementById('difficultyLevel').value = settings.difficultyLevel;
    
    // 重点科目
    const subjects = settings.focusSubjects || ['math', 'chinese', 'english'];
    document.querySelectorAll('input[name="subjects"]').forEach(checkbox => {
        checkbox.checked = subjects.includes(checkbox.value);
    });
    
    // 时间控制
    document.getElementById('limitTime').checked = settings.parentalControls.limitTime;
    document.getElementById('dailyTimeLimit').value = settings.timeLimit?.dailyMinutes || 60;
    document.getElementById('breakReminder').checked = settings.timeLimit?.breakReminder || true;
    document.getElementById('breakInterval').value = settings.timeLimit?.breakInterval || 30;
    
    // 每周时间限制
    const weeklyLimits = settings.timeLimit?.weeklyLimits || {};
    document.querySelectorAll('.weekday-limit').forEach(select => {
        const day = select.getAttribute('data-day');
        select.value = weeklyLimits[day] || (day === '6' || day === '0' ? 120 : 60);
    });
    
    // 学习报告
    document.getElementById('reportProgress').checked = settings.parentalControls.reportProgress;
    document.getElementById('reportFrequency').value = settings.reportFrequency || 'weekly';
    document.getElementById('parentEmail').value = settings.parentEmail || '';
    
    // 报告内容选项
    const reportItems = settings.reportItems || ['time', 'subjects', 'progress', 'mistakes', 'suggestions'];
    document.querySelectorAll('input[name="reportItems"]').forEach(checkbox => {
        checkbox.checked = reportItems.includes(checkbox.value);
    });
    
    // 即时通知
    document.getElementById('instantNotification').checked = settings.notifications?.enabled || false;
    const notificationTypes = settings.notifications?.types || ['overtime', 'achievement', 'warning'];
    document.querySelectorAll('input[name="notifications"]').forEach(checkbox => {
        checkbox.checked = notificationTypes.includes(checkbox.value);
    });
    
    // 安全设置
    document.getElementById('filterContent').checked = settings.parentalControls.filterContent;
    document.getElementById('securityLevel').value = settings.security?.level || 'medium';
    
    // 过滤选项
    const filterTypes = settings.security?.filters || ['language', 'topics', 'personal'];
    document.querySelectorAll('input[name="filters"]').forEach(checkbox => {
        checkbox.checked = filterTypes.includes(checkbox.value);
    });
    
    // 紧急联系人
    document.getElementById('emergencyContact').checked = settings.emergency?.enabled || false;
    document.getElementById('emergencyPhone').value = settings.emergency?.phone || '';
    
    // 初始化禁用词管理器
    initBannedWordsManager();
}

// 保存家长设置
function saveParentSettings() {
    const newSettings = {
        ...currentSettings,
        parentalSettings: {
            // 学生档案
            studentName: document.getElementById('studentName').value,
            studentAge: document.getElementById('studentAge').value,
            grade: document.getElementById('grade').value,
            learningStyle: document.getElementById('learningStyle').value,
            difficultyLevel: document.getElementById('difficultyLevel').value,
            
            // 科目设置
            subjects: Array.from(document.querySelectorAll('.subject-item')).map(item => ({
                name: item.querySelector('.subject-name').textContent,
                enabled: item.querySelector('input[type="checkbox"]').checked,
                level: item.querySelector('.subject-level').value
            })),
            
            // 时间管理
            timeLimit: {
                enabled: document.getElementById('limitTime').checked,
                dailyMinutes: parseInt(document.getElementById('dailyTimeLimit').value),
                startTime: document.getElementById('startTime').value,
                endTime: document.getElementById('endTime').value,
                breakReminder: document.getElementById('breakReminder').checked,
                breakInterval: parseInt(document.getElementById('breakInterval').value),
                breakDuration: parseInt(document.getElementById('breakDuration').value),
                weeklySchedule: Array.from(document.querySelectorAll('.schedule-row')).map(row => ({
                    day: parseInt(row.querySelector('.day-status').dataset.day),
                    enabled: row.querySelector('.day-status').checked,
                    duration: parseInt(row.querySelector('.day-duration').value),
                    startTime: row.querySelector('.day-start-time').value,
                    endTime: row.querySelector('.day-end-time').value
                }))
            },
            
            // 学习监管
            learningGoals: {
                enabled: true,
                dailyQuestions: parseInt(document.querySelector('.goal-item input[type="number"]').value),
                dailyMinutes: parseInt(document.querySelectorAll('.goal-item input[type="number"]')[1].value)
            },
            
            monitoring: {
                enabled: document.getElementById('learningMonitor').checked,
                features: Array.from(document.querySelectorAll('.monitor-settings input[type="checkbox"]'))
                    .filter(cb => cb.checked)
                    .map(cb => cb.parentElement.textContent.trim())
            },
            
            // 安全设置
            security: {
                filterContent: document.getElementById('filterContent').checked,
                level: document.getElementById('securityLevel').value,
                bannedWords: Array.from(document.querySelectorAll('.tag')).map(tag => 
                    tag.querySelector('span').textContent
                ),
                emergencyContact: {
                    enabled: document.getElementById('emergencyContact').checked,
                    phone: document.getElementById('emergencyPhone').value
                }
            }
        }
    };

    // 处理密码修改
    const newPassword = document.getElementById('newParentPassword').value;
    const confirmPassword = document.getElementById('confirmParentPassword').value;
    if (newPassword) {
        if (newPassword === confirmPassword) {
            localStorage.setItem('parentPassword', newPassword);
            document.getElementById('newParentPassword').value = '';
            document.getElementById('confirmParentPassword').value = '';
        } else {
            alert('两次输入的密码不一致！');
            return;
        }
    }

    // 保存设置
    currentSettings = updateSettings(newSettings);
    
    // 更新学习时间限制
    updateTimeRestrictions();
    
    // 更新监控状态
    updateMonitoringStatus();
    
    // 显示保存成功提示
    alert('家长设置已保存！');

    // 关闭面板和遮罩层
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    parentPanel.classList.remove('active');
    setTimeout(() => {
        parentPanel.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

// 切换家长设置面板
function toggleParentSettings() {
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    if (!parentPanel.classList.contains('active')) {
        parentPanel.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 添加动画类
        setTimeout(() => {
            parentPanel.classList.add('active');
        }, 10);
    } else {
        closeParentSettings();
    }
}

// 关闭面板函数
function closeParentSettings() {
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    parentPanel.classList.remove('active');
    setTimeout(() => {
        parentPanel.style.display = 'none';
        overlay.style.display = 'none';
        
        // 如果未登录，清空密码输入
        if (!isParentLoggedIn) {
            document.getElementById('parentPassword').value = '';
        }
    }, 300);
    
    document.body.style.overflow = '';
}

// 处理点击遮罩层关闭
overlay.addEventListener('click', closeParentSettings);

// 处理关闭按钮点击
closeBtn.addEventListener('click', closeParentSettings);

// 阻止面板内点击事件冒泡到遮罩层
parentSettingsPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

// 事件监听
parentLoginButton.addEventListener('click', handleParentLogin);
parentLogoutButton.addEventListener('click', handleParentLogout);
toggleParentSettingsButton.addEventListener('click', toggleParentSettings);
saveParentSettingsButton.addEventListener('click', saveParentSettings);

// Deepseek API配置
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = 'sk-2b089eb243dc469aa20ed9c340a0af4c';

// 构建Prompt模板
function buildPrompt(userMessage, settings) {
    const ageGroup = CONFIG.ageGroupSettings[settings.parentalSettings.studentAge];
    const learningStyle = CONFIG.learningStyles[settings.parentalSettings.learningStyle];
    const studentProfile = settings.parentalSettings;
    
    // 构建学习风格指南
    let styleGuide = [];
    if (learningStyle.useImages) {
        styleGuide.push('使用图像和视觉例子来解释');
    }
    if (learningStyle.useDialogue) {
        styleGuide.push('使用对话形式来讲解');
    }
    if (learningStyle.practicalExercises) {
        styleGuide.push('提供实践练习');
    }

    // 获取重点科目和难度
    const focusSubjects = studentProfile.subjects
        ?.filter(subject => subject.enabled)
        .map(subject => `${subject.name}(难度:${subject.level})`)
        .join('、') || settings.aiSubjects.join('、');

    // 获取学习目标
    const learningGoals = studentProfile.learningGoals;
    const dailyGoals = learningGoals?.enabled ? 
        `每日目标：完成${learningGoals.dailyQuestions}个问题，学习${learningGoals.dailyMinutes}分钟` : '';

    // 获取监控设置
    const monitoring = studentProfile.monitoring;
    const monitoringFeatures = monitoring?.enabled ?
        `监控重点：${monitoring.features.join('、')}` : '';

    // 获取安全设置
    const security = studentProfile.security;
    const securityLevel = security?.level || 'medium';
    const bannedWords = security?.bannedWords || [];
    const contentFiltering = security?.filterContent ? 
        `内容过滤：已启用（级别：${securityLevel}）` : '';

    // 构建完整的prompt
    const basePrompt = `作为一个名叫${settings.aiName}的K12教育AI助手，我需要：

1. 学生基本信息：
- 姓名：${studentProfile.studentName || '同学'}
- 年龄段：${studentProfile.studentAge}岁
- 年级：${studentProfile.grade}年级
- 学习风格：${studentProfile.learningStyle}
- 难度级别：${studentProfile.difficultyLevel}

2. 重点关注科目：
${focusSubjects}

3. 学习特点：
- 学习风格：${studentProfile.learningStyle}（${styleGuide.join('，')}）
- 当前学习阶段重点：${ageGroup.vocabulary}级别词汇
- 回答长度限制：${ageGroup.maxResponseLength}字以内
- 使用表情符号：${ageGroup.useEmoji ? '是' : '否'}

4. 学习目标：
${dailyGoals}
${monitoringFeatures}

5. 安全和内容控制：
${contentFiltering}
禁用词：${bannedWords.length > 0 ? '已设置' : '无'}

6. 回答要求：
- 严格遵循学生年级和学习特点调整表达方式
- 确保回答难度符合学生水平（${studentProfile.difficultyLevel}级别）
- 优先关联学生的重点科目进行知识串联
- 根据学生的学习风格选择合适的例子和解释方式
- 注意培养学生的思维能力和学习兴趣
- 适时给予鼓励，培养学习自信
- 注意避免使用任何禁用词
- 如果问题涉及敏感内容，给出合适的引导

7. 互动策略：
- 循序渐进：从简单到复杂
- 启发引导：引导学生思考
- 知识关联：将新知识与已学内容建立联系
- 实践应用：提供实际应用场景
- 及时反馈：给予具体的改进建议
- 正面激励：赞扬进步，鼓励尝试

8. 特殊指导：
- 发现学习困难时，及时调整讲解方式
- 遇到敏感话题时，妥善引导到积极正面的方向
- 注意培养学生的学习主动性和独立思考能力
- 保持回答的趣味性和教育性平衡

问题：${userMessage}

请根据以上信息，提供一个适合该学生特点和需求的回答。注意回答要符合学生的认知水平，并有助于达成其学习目标。`;

    return basePrompt;
}

// 生成AI回复
async function generateAIResponse(userMessage) {
    const settings = getCurrentSettings();
    const prompt = buildPrompt(userMessage, settings);
    
    try {
        // 调用Deepseek API获取回复
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-ca424591f4974e2cb3bf66e73b99886c'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: `你是一个专业的K12教育AI助手，需要：
1. 严格遵循提供的学生档案信息来调整回答
2. 根据学生的年级和学习特点调整语言难度
3. 结合学生的重点科目进行知识关联
4. 使用学生喜欢的学习方式来解释概念
5. 在回答中融入适当��鼓励和引导
请使用中文回复，并确保回答符合学生的认知水平。`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;

        // 根据年龄组设置添加表情和语气词
        if (settings.parentalSettings.studentAge === '6-8' || settings.parentalSettings.studentAge === '9-11') {
            const thinking = CONFIG.tonePatterns.thinking[Math.floor(Math.random() * CONFIG.tonePatterns.thinking.length)];
            const friendly = CONFIG.tonePatterns.friendly[Math.floor(Math.random() * CONFIG.tonePatterns.friendly.length)];
            const emoji = CONFIG.emojis.happy[Math.floor(Math.random() * CONFIG.emojis.happy.length)];
            
            aiResponse = `${thinking}${friendly} ${aiResponse} ${emoji}`;
            
            // 随机添加鼓励语
            if (Math.random() > 0.7) {
                const encouraging = CONFIG.tonePatterns.encouraging[Math.floor(Math.random() * CONFIG.tonePatterns.encouraging.length)];
                aiResponse += ` ${encouraging}`;
            }
        }
        
        return aiResponse;
    } catch (error) {
        console.error('生成回复时出错:', error);
        return CONFIG.defaultSettings.errorMessage;
    }
}

// 聊天记录和心理健康分析
class ChatMonitor {
    constructor() {
        this.chatHistory = [];
        this.mentalHealthData = {
            emotionTrends: [],
            keywordFrequency: {},
            interactionMetrics: [],
            lastAnalysis: null
        };
        this.loadHistory();
    }

    // 记录聊天消息
    recordChat(message, isUser) {
        const chatEntry = {
            timestamp: new Date().toISOString(),
            content: message,
            isUser: isUser,
            sentiment: this.analyzeSentiment(message),
            keywords: this.extractKeywords(message)
        };

        this.chatHistory.push(chatEntry);
        this.saveHistory();
        this.analyzeMentalHealth(chatEntry);
    }

    // 情感分析
    analyzeSentiment(message) {
        const settings = CONFIG.defaultSettings.parentalSettings.monitoring.mentalHealth;
        let score = 0;
        
        // 分析积极/消极关键词
        if (settings && settings.alertKeywords) {
            Object.entries(settings.alertKeywords).forEach(([category, keywords]) => {
                keywords.forEach(keyword => {
                    if (message.includes(keyword)) {
                        score += this.getKeywordScore(category, keyword);
                    }
                });
            });
        }

        return score;
    }

    // 获取关键词分数
    getKeywordScore(category) {
        const negativeCategories = ['anxiety', 'depression', 'anger'];
        return negativeCategories.includes(category) ? -1 : 1;
    }

    // 提取关键词
    extractKeywords(message) {
        const keywords = [];
        const settings = CONFIG.defaultSettings.parentalSettings.monitoring.mentalHealth;
        
        if (settings && settings.alertKeywords) {
            Object.entries(settings.alertKeywords).forEach(([category, categoryKeywords]) => {
                categoryKeywords.forEach(keyword => {
                    if (message.includes(keyword)) {
                        keywords.push({ category, keyword });
                    }
                });
            });
        }

        return keywords;
    }

    // 心理健康分析
    analyzeMentalHealth(chatEntry) {
        const settings = currentSettings.parentalSettings.monitoring.mentalHealth;
        if (!settings.enabled) return;

        // 更新情绪趋势
        this.mentalHealthData.emotionTrends.push({
            timestamp: chatEntry.timestamp,
            sentiment: chatEntry.sentiment
        });

        // 更新关键词频率
        chatEntry.keywords.forEach(({ category, keyword }) => {
            if (!this.mentalHealthData.keywordFrequency[category]) {
                this.mentalHealthData.keywordFrequency[category] = {};
            }
            if (!this.mentalHealthData.keywordFrequency[category][keyword]) {
                this.mentalHealthData.keywordFrequency[category][keyword] = 0;
            }
            this.mentalHealthData.keywordFrequency[category][keyword]++;
        });

        // 检查是否要生成分析报告
        this.checkAndGenerateReport();

        // 检查是否需要发送警报
        this.checkAlerts(chatEntry);
    }

    // 检查并生成报告
    checkAndGenerateReport() {
        const settings = currentSettings.parentalSettings.monitoring.mentalHealth;
        const now = new Date();
        
        if (!this.mentalHealthData.lastAnalysis) {
            this.mentalHealthData.lastAnalysis = now;
            return;
        }

        const timeSinceLastAnalysis = now - new Date(this.mentalHealthData.lastAnalysis);
        const shouldGenerate = {
            daily: timeSinceLastAnalysis >= 24 * 60 * 60 * 1000,
            weekly: timeSinceLastAnalysis >= 7 * 24 * 60 * 60 * 1000,
            monthly: timeSinceLastAnalysis >= 30 * 24 * 60 * 60 * 1000
        }[settings.analysisFrequency];

        if (shouldGenerate) {
            this.generateMentalHealthReport();
            this.mentalHealthData.lastAnalysis = now;
        }
    }

    // 生成心理健康报告
    generateMentalHealthReport() {
        const settings = currentSettings.parentalSettings.monitoring.mentalHealth;
        const report = {
            timestamp: new Date().toISOString(),
            emotionalState: this.analyzeEmotionalState(),
            keywordAnalysis: this.analyzeKeywords(),
            socialInteraction: this.analyzeSocialInteraction(),
            academicStress: this.analyzeAcademicStress(),
            recommendations: this.generateRecommendations()
        };

        // 发送报告通知
        this.sendReport(report);
    }

    // 分析情绪状态
    analyzeEmotionalState() {
        const recentEmotions = this.mentalHealthData.emotionTrends.slice(-50);
        const averageSentiment = recentEmotions.reduce((sum, e) => sum + e.sentiment, 0) / recentEmotions.length;
        
        return {
            average: averageSentiment,
            trend: this.calculateTrend(recentEmotions.map(e => e.sentiment)),
            status: this.getEmotionalStatus(averageSentiment)
        };
    }

    // 分析关键词
    analyzeKeywords() {
        const analysis = {};
        Object.entries(this.mentalHealthData.keywordFrequency).forEach(([category, keywords]) => {
            analysis[category] = {
                totalMentions: Object.values(keywords).reduce((sum, count) => sum + count, 0),
                topKeywords: Object.entries(keywords)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
            };
        });
        return analysis;
    }

    // 分析社交互动
    analyzeSocialInteraction() {
        const socialKeywords = this.mentalHealthData.keywordFrequency.social || {};
        const totalMentions = Object.values(socialKeywords).reduce((sum, count) => sum + count, 0);
        
        return {
            frequency: totalMentions,
            concerns: this.identifySocialConcerns(socialKeywords),
            suggestions: this.generateSocialSuggestions(socialKeywords)
        };
    }

    // 分析学习压力
    analyzeAcademicStress() {
        const academicKeywords = this.mentalHealthData.keywordFrequency.academic || {};
        const totalMentions = Object.values(academicKeywords).reduce((sum, count) => sum + count, 0);
        
        return {
            level: this.calculateStressLevel(academicKeywords),
            concerns: this.identifyAcademicConcerns(academicKeywords),
            suggestions: this.generateAcademicSuggestions(academicKeywords)
        };
    }

    // 生成建议
    generateRecommendations() {
        const emotionalState = this.analyzeEmotionalState();
        const recommendations = [];

        if (emotionalState.average < -0.3) {
            recommendations.push({
                type: "emotional",
                priority: "high",
                suggestion: "建议增加亲子互动时间，多关注孩子的情绪变化"
            });
        }

        // 根据社交分析生成建议
        const socialAnalysis = this.analyzeSocialInteraction();
        if (socialAnalysis.concerns.length > 0) {
            recommendations.push({
                type: "social",
                priority: "medium",
                suggestion: "建议关注孩子的社交情况，适当组织同龄人活动"
            });
        }

        // 根据学习压力分析生成建议
        const academicAnalysis = this.analyzeAcademicStress();
        if (academicAnalysis.level === "high") {
            recommendations.push({
                type: "academic",
                priority: "high",
                suggestion: "建议适当调整学习计划，避免过度施压"
            });
        }

        return recommendations;
    }

    // 检查警报
    checkAlerts(chatEntry) {
        const settings = currentSettings.parentalSettings.monitoring.mentalHealth;
        
        // 检查情感值是否超过阈值
        if (chatEntry.sentiment < settings.sentimentThresholds.negative) {
            this.sendAlert({
                type: "emotional",
                level: "warning",
                message: "检测到孩子可能存在负面情绪，建及时关注"
            });
        }

        // 检查关键词预警
        chatEntry.keywords.forEach(({ category, keyword }) => {
            if (['anxiety', 'depression', 'anger'].includes(category)) {
                this.sendAlert({
                    type: "keyword",
                    level: "warning",
                    message: `检测到关注关键词："${keyword}"，属于${category}类，建议关注`
                });
            }
        });
    }

    // 发送警报
    sendAlert(alert) {
        // 发送通知
        sendNotification("心理健康预警", alert.message);
        
        // 记录警报
        this.logAlert(alert);
    }

    // 发送报告
    sendReport(report) {
        const parentEmail = currentSettings.parentalSettings.parentEmail;
        if (parentEmail) {
            console.log("发送心理健康报告到邮箱:", parentEmail, report);
            // 这里添加发送邮件的具体实现
        }

        // 保存报告到本地
        this.saveReport(report);
    }

    // 保存聊天历史
    saveHistory() {
        const settings = currentSettings.parentalSettings.monitoring.chatHistory;
        const maxAge = settings.storeDays * 24 * 60 * 60 * 1000;
        
        // 清理过期记录
        const now = new Date();
        this.chatHistory = this.chatHistory.filter(entry => {
            const age = now - new Date(entry.timestamp);
            return age <= maxAge;
        });

        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        localStorage.setItem('mentalHealthData', JSON.stringify(this.mentalHealthData));
    }

    // 加载聊天历史
    loadHistory() {
        const savedHistory = localStorage.getItem('chatHistory');
        const savedMentalHealth = localStorage.getItem('mentalHealthData');
        
        if (savedHistory) {
            this.chatHistory = JSON.parse(savedHistory);
        }
        
        if (savedMentalHealth) {
            this.mentalHealthData = JSON.parse(savedMentalHealth);
        }
    }

    // 导出聊天记录
    exportChatHistory() {
        const settings = currentSettings.parentalSettings.monitoring.chatHistory;
        const format = settings.exportFormat;
        
        // 根据隐私级别过滤数据
        const exportData = this.filterDataByPrivacy(this.chatHistory);
        
        if (format === 'pdf') {
            return this.generatePDF(exportData);
        } else {
            return JSON.stringify(exportData, null, 2);
        }
    }

    // 根据隐私级别过滤数据
    filterDataByPrivacy(data) {
        const settings = currentSettings.parentalSettings.monitoring.chatHistory;
        const privacyLevel = settings.privacyLevel;
        
        return data.map(entry => {
            const filtered = { ...entry };
            
            if (privacyLevel === 'high') {
                // 高级隐私：仅保留基本分析数据
                filtered.content = '[内容已隐藏]';
            } else if (privacyLevel === 'medium') {
                // 中级隐私：保留关键信息，隐藏具体内容
                filtered.content = this.maskSensitiveContent(entry.content);
            }
            
            return filtered;
        });
    }

    // 掩码敏感内容
    maskSensitiveContent(content) {
        const settings = currentSettings.parentalSettings.monitoring.mentalHealth;
        let maskedContent = content;
        
        // 遍历所有敏感关键词
        Object.values(settings.alertKeywords).flat().forEach(keyword => {
            if (maskedContent.includes(keyword)) {
                maskedContent = maskedContent.replace(new RegExp(keyword, 'g'), '***');
            }
        });
        
        return maskedContent;
    }
}

// 创建聊天监控实例
const chatMonitor = new ChatMonitor();

// 检查时间限制
function checkTimeLimit() {
    const settings = getCurrentSettings();
    const timeSettings = settings?.parentalSettings?.timeLimit;
    if (!timeSettings?.enabled) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = (timeSettings.startTime || "14:00").split(':').map(Number);
    const [endHour, endMinute] = (timeSettings.endTime || "20:00").split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime < startTime || currentTime > endTime) {
        alert(`当前不在允许使用的时间段内（${timeSettings.startTime} - ${timeSettings.endTime}）`);
        return false;
    }

    return true;
}

// 内容过滤
function filterContent(message) {
    const settings = getCurrentSettings();
    if (!settings?.parentalSettings?.contentFilter?.enabled) {
        return true;
    }

    const bannedWords = settings?.parentalSettings?.security?.bannedWords || [];
    if (bannedWords.some(word => message.includes(word))) {
        alert('消息中包含不适合的内容，请重新输入。');
        return false;
    }

    return true;
}

// 修改消息发送处理函数
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // 检查使用���间限制
    if (!checkTimeLimit()) {
        return;
    }

    // 内容过滤
    if (!filterContent(message)) {
        return;
    }

    // 清空输入框
    userInput.value = '';

    // 添加用户消息
    await addMessage('user', message);

    // 显示思考中状态
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai thinking';
    const thinkingAvatar = document.createElement('div');
    thinkingAvatar.className = 'avatar';
    thinkingAvatar.textContent = '🤖';
    const thinkingContent = document.createElement('div');
    thinkingContent.className = 'message-content';
    thinkingContent.textContent = '思考中...';
    thinkingDiv.appendChild(thinkingAvatar);
    thinkingDiv.appendChild(thinkingContent);
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // 生成AI回复
        const aiResponse = await generateAIResponse(message);

        // 移除思考中的消息
        thinkingDiv.remove();

        // 添加AI回复（使用流式输出）
        const messageDiv = await addMessage('ai', aiResponse, true);

        // 自动朗读回复（如果启用）
        const settings = getCurrentSettings();
        if (settings.autoSpeak) {
            speakText(aiResponse, messageDiv);
        }

    } catch (error) {
        console.error('生成回复时出错:', error);
        
        // 移除思考中的消息
        thinkingDiv.remove();

        // 显示错误消息
        const errorMessage = CONFIG.defaultSettings.errorMessage;
        await addMessage('ai', errorMessage);
    }
}

// 修改欢迎消息显示
async function showWelcomeMessage() {
    const settings = getCurrentSettings();
    const greeting = settings.greeting.replace('{aiName}', settings.aiName);
    // 清除现有的欢迎消息
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    // 添加新的欢迎消息
    await addMessage('ai', greeting, true);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    showWelcomeMessage();
    initSpeechRecognition();
});

// 构建Prompt模板
function buildPrompt(userMessage, settings) {
    const ageGroup = CONFIG.ageGroupSettings[settings.parentalSettings.studentAge];
    const learningStyle = CONFIG.learningStyles[settings.parentalSettings.learningStyle];
    
    let styleGuide = '';
    if (learningStyle.useImages) {
        styleGuide += '使用图像和视觉例子来解释, ';
    }
    if (learningStyle.useDialogue) {
        styleGuide += '使用对话形式来讲解, ';
    }
    if (learningStyle.practicalExercises) {
        styleGuide += '提供实践练习, ';
    }

    const basePrompt = `作为一个名叫${settings.aiName}的K12教育AI助手，
我的性格特点是：${settings.aiPersonality}
我特别擅长的学科包括：${settings.aiSubjects.join('、')}

学生信息：
- 年龄段：${settings.parentalSettings.studentAge}岁
- 学习风格：${settings.parentalSettings.learningStyle}
- 难度级别：${settings.parentalSettings.difficultyLevel}

回答要求：
1. 使用${ageGroup.vocabulary}级别的词汇
2. 回答长度控制在${ageGroup.maxResponseLength}字以内
3. ${styleGuide}
4. 保持积极正面的语气
5. 鼓励思考和提问

问题：${userMessage}`;

    return basePrompt;
}

// 添加事件监听器
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

// 处理设置面板
function toggleSettings() {
    settingsPanel.classList.toggle('active');
}

// 保存新设置
function saveNewSettings() {
    const newSettings = {
        aiName: document.getElementById('aiName').value,
        aiPersonality: document.getElementById('aiPersonality').value,
        aiSubjects: document.getElementById('aiSubjects').value.split(',').map(s => s.trim()),
        parentalSettings: {
            studentAge: document.getElementById('studentAge').value,
            learningStyle: document.getElementById('learningStyle').value,
            difficultyLevel: document.getElementById('difficultyLevel').value,
            parentalControls: {
                limitTime: document.getElementById('limitTime').checked,
                filterContent: document.getElementById('filterContent').checked,
                reportProgress: document.getElementById('reportProgress').checked
            },
            parentEmail: document.getElementById('parentEmail').value
        }
    };
    
    currentSettings = updateSettings(newSettings);
    toggleSettings();
    
    // 显示确认消息
    addMessage('ai', `设置已更新${CONFIG.emojis.success[0]} 我现在是${currentSettings.aiName}了！我会根据学生年龄和学习风格来调整回答。`);
}

// 检查休息时间
function checkBreakTime() {
    const timeSettings = currentSettings?.parentalSettings?.timeLimit;
    if (!timeSettings?.breakReminder) return;
    
    const now = new Date();
    const today = now.toDateString();
    const usageData = JSON.parse(localStorage.getItem('usageData') || '{}');
    
    if (usageData[today] && usageData[today] % timeSettings.breakInterval === 0) {
        alert(`温馨提示：已经学习${timeSettings.breakInterval}分钟了，该休息${timeSettings.breakDuration}分钟啦！`);
    }
}

// 辅助函数：解析时间字符串
function parseTimeString(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// 更新学习进度
function updateLearningProgress(question, answer) {
    if (!currentSettings.parentalSettings.parentalControls.reportProgress) {
        return;
    }

    const progressData = JSON.parse(localStorage.getItem('progressData') || '{}');
    const today = new Date().toISOString().split('T')[0];
    
    if (!progressData[today]) {
        progressData[today] = {
            questionsCount: 0,
            learningTime: 0,
            subjects: {},
            difficulty: currentSettings.parentalSettings.difficultyLevel,
            style: currentSettings.parentalSettings.learningStyle
        };
    }
    
    progressData[today].questionsCount++;
    progressData[today].learningTime += 1;
    
    // 识别问题涉及的学科
    Object.entries(CONFIG.subjectKeywords).forEach(([subject, keywords]) => {
        if (keywords.some(keyword => question.includes(keyword))) {
            if (!progressData[today].subjects[subject]) {
                progressData[today].subjects[subject] = 0;
            }
            progressData[today].subjects[subject]++;
        }
    });
    
    localStorage.setItem('progressData', JSON.stringify(progressData));
    
    // 根据报告频率检查是否需要发送报告
    const reportFrequency = currentSettings.parentalSettings.reportFrequency;
    checkAndSendReport(reportFrequency);
}

// 更新报告发送函数
function checkAndSendReport(frequency) {
    const lastReportDate = localStorage.getItem('lastReportDate');
    const today = new Date();
    let shouldSendReport = false;
    
    if (!lastReportDate) {
        shouldSendReport = true;
    } else {
        const lastDate = new Date(lastReportDate);
        switch (frequency) {
            case 'daily':
                shouldSendReport = today.toDateString() !== lastDate.toDateString();
                break;
            case 'weekly':
                const weekDiff = Math.floor((today - lastDate) / (7 * 24 * 60 * 60 * 1000));
                shouldSendReport = weekDiff >= 1;
                break;
            case 'monthly':
                shouldSendReport = today.getMonth() !== lastDate.getMonth() ||
                                 today.getFullYear() !== lastDate.getFullYear();
                break;
        }
    }
    
    if (shouldSendReport && currentSettings.parentalSettings.parentEmail) {
        const progressData = JSON.parse(localStorage.getItem('progressData') || '{}');
        // 这里加发送邮件的逻辑
        console.log('发送学习报告:', {
            email: currentSettings.parentalSettings.parentEmail,
            frequency: frequency,
            data: progressData
        });
        localStorage.setItem('lastReportDate', today.toISOString());
    }
}

// 事件监听器
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
toggleSettingsButton.addEventListener('click', toggleSettings);
saveSettingsButton.addEventListener('click', saveNewSettings);

// 标签页切换逻辑
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // 添加当前标签的活动状态
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // 如果是心���健康标签页，初始化图表
                if (tabId === 'mentalHealthTab') {
                    if (document.getElementById('emotionTrendChart')) {
                        initCharts();
                    }
                }
            }
        });
    });
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    
    // 初始化心理健康监控
    if (document.getElementById('emotionTrendChart')) {
        initCharts();
        // 设置定期更新
        setInterval(updateChartData, 60000); // 每分钟更新一次
    }
});

// 禁用词标签管理
function initBannedWordsManager() {
    const input = document.getElementById('bannedWords');
    const container = document.querySelector('.tags-container');
    const bannedWords = new Set(JSON.parse(localStorage.getItem('bannedWords') || '[]'));

    // 初始化已有标签
    bannedWords.forEach(word => addTag(word));

    // 添加标签
    function addTag(word) {
        if (!word) return;
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            <span>${word}</span>
            <span class="tag-remove">×</span>
        `;
        tag.querySelector('.tag-remove').addEventListener('click', () => {
            container.removeChild(tag);
            bannedWords.delete(word);
            saveBannedWords();
        });
        container.appendChild(tag);
        bannedWords.add(word);
        saveBannedWords();
    }

    // 保存禁用词
    function saveBannedWords() {
        localStorage.setItem('bannedWords', JSON.stringify([...bannedWords]));
    }

    // 入处理
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const word = input.value.trim();
            if (word && !bannedWords.has(word)) {
                addTag(word);
                input.value = '';
            }
        }
    });
}

// 即时通知处理
function checkAndSendNotification(message, response) {
    const notifications = currentSettings.parentalSettings.notifications;
    if (!notifications?.enabled) return;
    
    const notificationTypes = notifications.types || [];
    
    // 检查学习成就
    if (notificationTypes.includes('achievement') && response.includes('做得很好')) {
        sendNotification('学习成就', '你的孩子取得了新的进步！');
    }
    
    // 检查异常行为
    if (notificationTypes.includes('warning') && 
        currentSettings.parentalSettings.security.bannedWords.some(word => message.includes(word))) {
        sendNotification('行为提醒', '检测到可能的不当行为，请关注。');
    }
}

// 发送通知
function sendNotification(title, message) {
    // 如果支持系统通知
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
    
    // 如果配置了紧急联系人
    if (currentSettings.parentalSettings.emergency?.enabled) {
        console.log('发送短信通知到:', currentSettings.parentalSettings.emergency.phone);
        // 这里添加发送短信的逻辑
    }
}

// 初始化
function init() {
    showWelcomeMessage();
    initTabs();
    initBannedWordsManager();
    
    // 请求通知权限
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// 初始化每周时间表
function initWeeklySchedule() {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const scheduleBody = document.querySelector('.schedule-body');
    
    weekDays.forEach((day, index) => {
        const row = document.createElement('div');
        row.className = 'schedule-row';
        row.innerHTML = `
            <span>周${day}</span>
            <label class="switch-label">
                <input type="checkbox" class="day-status" data-day="${index}" ${index < 5 ? 'checked' : ''}>
                <span>启用</span>
            </label>
            <select class="day-duration" data-day="${index}" ${index >= 5 ? 'disabled' : ''}>
                <option value="30">30分钟</option>
                <option value="60" ${index < 5 ? 'selected' : ''}>1小时</option>
                <option value="90">1.5小时</option>
                <option value="120" ${index >= 5 ? 'selected' : ''}>2小时</option>
                <option value="180">3小时</option>
            </select>
            <div class="time-range">
                <input type="time" class="day-start-time" data-day="${index}" 
                       value="${index < 5 ? '14:00' : '09:00'}" ${index >= 5 ? 'disabled' : ''}>
                <span>至</span>
                <input type="time" class="day-end-time" data-day="${index}"
                       value="${index < 5 ? '18:00' : '17:00'}" ${index >= 5 ? 'disabled' : ''}>
            </div>
        `;
        scheduleBody.appendChild(row);
        
        // 添加状态切换事件
        const statusCheckbox = row.querySelector('.day-status');
        const timeInputs = row.querySelectorAll('input[type="time"]');
        const durationSelect = row.querySelector('.day-duration');
        
        statusCheckbox.addEventListener('change', function() {
            timeInputs.forEach(input => input.disabled = !this.checked);
            durationSelect.disabled = !this.checked;
        });
    });
}

// 更新学习目标设置
function initLearningGoals() {
    const goalSettings = document.querySelector('.goal-settings');
    
    // 添加目标变更事件
    goalSettings.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const numberInput = checkbox.closest('.goal-item').querySelector('input[type="number"]');
        checkbox.addEventListener('change', function() {
            numberInput.disabled = !this.checked;
        });
    });
}

// 更新学习监控设置
function initLearningMonitor() {
    const monitorCheckbox = document.getElementById('learningMonitor');
    const subSettings = document.querySelector('.monitor-settings');
    
    monitorCheckbox.addEventListener('change', function() {
        subSettings.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.disabled = !this.checked;
        });
    });
}

// 更新时间限制
function updateTimeRestrictions() {
    const timeSettings = currentSettings?.parentalSettings?.timeLimit || CONFIG.defaultSettings.parentalSettings.timeLimit;
    
    if (timeSettings?.enabled) {
        // 清除现有的定时器
        if (window.timeCheckInterval) {
            clearInterval(window.timeCheckInterval);
        }
        if (window.breakCheckInterval) {
            clearInterval(window.breakCheckInterval);
        }
        
        // 设置新的定时器
        window.timeCheckInterval = setInterval(checkTimeLimit, 60000); // 每分钟检查一次
        
        if (timeSettings.breakReminder) {
            window.breakCheckInterval = setInterval(() => {
                const now = new Date();
                const schedule = timeSettings.weeklySchedule.find(s => s.day === now.getDay());
                if (schedule?.enabled) {
                    checkBreakTime();
                }
            }, timeSettings.breakInterval * 60000);
        }
    }
}

// 更新监控状态
function updateMonitoringStatus() {
    const monitoring = currentSettings?.parentalSettings?.monitoring || CONFIG.defaultSettings.parentalSettings.monitoring;
    
    if (monitoring?.enabled) {
        // 启动专注度监测
        if (monitoring.features.includes('专注度监测')) {
            startFocusMonitoring();
        }
        
        // 启动进度跟踪
        if (monitoring.features.includes('进度跟踪')) {
            startProgressTracking();
        }
        
        // 启动错题分析
        if (monitoring.features.includes('错题分析')) {
            startMistakeAnalysis();
        }
        
        // 启动行为记录
        if (monitoring.features.includes('行为记录')) {
            startBehaviorTracking();
        }
    }
}

// 专注度监测
function startFocusMonitoring() {
    let lastActiveTime = Date.now();
    let warningCount = 0;
    
    // 检���用户活动
    document.addEventListener('mousemove', () => lastActiveTime = Date.now());
    document.addEventListener('keypress', () => lastActiveTime = Date.now());
    
    // 定期检查专注度
    setInterval(() => {
        const now = Date.now();
        const idleTime = (now - lastActiveTime) / 1000;
        
        if (idleTime > 300) { // 5分钟无活动
            warningCount++;
            if (warningCount >= 3) {
                sendNotification('专注度提醒', '检测到长时间无活动，请保持专注！');
                warningCount = 0;
            }
        }
    }, 60000);
}

// 进度跟踪
function startProgressTracking() {
    const goals = currentSettings.parentalSettings.learningGoals;
    let dailyProgress = {
        questions: 0,
        minutes: 0,
        startTime: Date.now()
    };
    
    // 更新学习时长
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            dailyProgress.minutes++;
            
            // 检查是否达到目标
            if (dailyProgress.minutes >= goals.dailyMinutes) {
                sendNotification('学习目标', '今日学习时长目标已达成！');
            }
        }
    }, 60000);
    
    // 记录完成的题目
    window.addEventListener('questionCompleted', () => {
        dailyProgress.questions++;
        if (dailyProgress.questions >= goals.dailyQuestions) {
            sendNotification('学习目标', '今日题目数量目标已达成！');
        }
    });
}

// 错题分析
function startMistakeAnalysis() {
    let mistakePatterns = {};
    
    // 记录错题
    window.addEventListener('questionAnswered', (e) => {
        if (!e.detail.correct) {
            const subject = e.detail.subject;
            const type = e.detail.type;
            
            if (!mistakePatterns[subject]) {
                mistakePatterns[subject] = {};
            }
            if (!mistakePatterns[subject][type]) {
                mistakePatterns[subject][type] = 0;
            }
            
            mistakePatterns[subject][type]++;
            
            // 检查是否形成错题模式
            if (mistakePatterns[subject][type] >= 3) {
                sendNotification('错题提醒', `发现${subject}科目${type}类型题目重复错误，建议重点关注！`);
            }
        }
    });
}

// 行为跟踪
function startBehaviorTracking() {
    let suspiciousPatterns = 0;
    
    // 监控复制粘贴行为
    document.addEventListener('copy', () => {
        suspiciousPatterns++;
        checkSuspiciousActivity();
    });
    
    document.addEventListener('paste', () => {
        suspiciousPatterns++;
        checkSuspiciousActivity();
    });
    
    // 监控快速切换窗口
    let lastBlurTime = 0;
    window.addEventListener('blur', () => {
        const now = Date.now();
        if (now - lastBlurTime < 5000) { // 5秒内频繁切换
            suspiciousPatterns++;
            checkSuspiciousActivity();
        }
        lastBlurTime = now;
    });
    
    function checkSuspiciousActivity() {
        if (suspiciousPatterns >= 5) {
            sendNotification('行为提醒', '检测到异常操作行为，请督促专注学习');
            suspiciousPatterns = 0;
        }
    }
}

// 初始化所有功能
function initParentControls() {
    try {
        initWeeklySchedule();
        initLearningGoals();
        initLearningMonitor();
        
        // 加载保存的设置
        loadParentSettings();
        
        // 更新时间限制和监控状态
        if (currentSettings?.parentalSettings) {
            updateTimeRestrictions();
            updateMonitoringStatus();
        }
    } catch (error) {
        console.error('初始化家长控制时出错:', error);
    }
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initParentControls);

init(); 

// 家长控制面板显示/隐藏逻辑
document.getElementById('toggleParentSettings').addEventListener('click', function() {
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    parentPanel.style.display = 'block';
    overlay.style.display = 'block';
    
    // 添加动画类
    setTimeout(() => {
        parentPanel.classList.add('active');
    }, 10);
});

// 关闭按钮逻辑
document.querySelector('.parent-settings-panel .close-btn').addEventListener('click', function() {
    const parentPanel = document.querySelector('.parent-settings-panel');
    const overlay = document.querySelector('.overlay');
    
    parentPanel.classList.remove('active');
    parentPanel.style.display = 'none';
    overlay.style.display = 'none';
});

// 遮罩层点击关闭
document.querySelector('.overlay').addEventListener('click', function() {
    const parentPanel = document.querySelector('.parent-settings-panel');
    
    parentPanel.classList.remove('active');
    parentPanel.style.display = 'none';
    this.style.display = 'none';
});

// 标签页切换逻辑
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有标签的active类
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        // 移除所有内容区域的active类
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 添加当前标签的active类
        this.classList.add('active');
        // 显示对应的内容区域
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
}); 

// 图表相关变量
let emotionTrendChart = null;
let keywordPieChart = null;
let stressLevelChart = null;
let socialInteractionChart = null;

// 初始化所有图表
function initCharts() {
    initEmotionTrendChart();
    initKeywordPieChart();
    initStressLevelChart();
    initSocialInteractionChart();
    updateChartData(); // 首次更新数据
}

// 情绪趋势图表
function initEmotionTrendChart() {
    const ctx = document.getElementById('emotionTrendChart').getContext('2d');
    emotionTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '情绪指数',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 关键词饼图
function initKeywordPieChart() {
    const ctx = document.getElementById('keywordPieChart').getContext('2d');
    keywordPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FFC107',
                    '#9C27B0',
                    '#FF5722'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// 压力水平图表
function initStressLevelChart() {
    const ctx = document.getElementById('stressLevelChart').getContext('2d');
    stressLevelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['学习压力', '考试压力', '社交压力', '时间压力'],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(156, 39, 176, 0.7)'
                ],
                borderWidth: 0,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 社交互动图表
function initSocialInteractionChart() {
    const ctx = document.getElementById('socialInteractionChart').getContext('2d');
    socialInteractionChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['互动频率', '回应质量', '情感表达', '问题解决', '知识分享'],
            datasets: [{
                label: '本周表现',
                data: [],
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4CAF50',
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// 更新图表数据
function updateChartData() {
    // 更新情绪趋势数据
    const emotionData = generateEmotionData();
    updateEmotionTrendChart(emotionData);
    
    // 更新关键词分析数据
    const keywordData = analyzeKeywords();
    updateKeywordPieChart(keywordData);
    
    // 更新压力水平数据
    const stressData = calculateStressLevels();
    updateStressLevelChart(stressData);
    
    // 更新社交互动数据
    const socialData = analyzeSocialInteraction();
    updateSocialInteractionChart(socialData);
    
    // 更新预警信息
    updateWarnings();
    
    // 更新建议列表
    updateRecommendations();
}

// 生成情绪数据
function generateEmotionData() {
    const dates = getLast7Days();
    const emotions = chatMonitor.mentalHealthData.emotionTrends
        .slice(-7)
        .map(trend => ({
            date: new Date(trend.timestamp).toLocaleDateString(),
            value: normalizeEmotionValue(trend.sentiment)
        }));
    
    return {
        labels: dates,
        values: emotions.map(e => e.value)
    };
}

// 分析关键词
function analyzeKeywords() {
    const keywordFreq = chatMonitor.mentalHealthData.keywordFrequency;
    const categories = Object.keys(keywordFreq);
    const data = categories.map(category => ({
        category,
        count: Object.values(keywordFreq[category]).reduce((a, b) => a + b, 0)
    }));
    
    return {
        labels: data.map(d => d.category),
        values: data.map(d => d.count)
    };
}

// 计算压力水平
function calculateStressLevels() {
    const chatHistory = chatMonitor.chatHistory;
    const stressKeywords = {
        study: ['考试', '作业', '学习'],
        exam: ['考试', '测试', '成绩'],
        social: ['朋友', '同学', '老师'],
        time: ['时间', '迟到', '赶']
    };
    
    const levels = Object.keys(stressKeywords).map(type => {
        const keywords = stressKeywords[type];
        const mentions = chatHistory.filter(chat => 
            keywords.some(keyword => chat.content.includes(keyword))
        ).length;
        return (mentions / chatHistory.length) * 100;
    });
    
    return levels;
}

// 分析社交互动
function analyzeSocialInteraction() {
    const chatHistory = chatMonitor.chatHistory;
    const metrics = {
        frequency: calculateInteractionFrequency(chatHistory),
        quality: calculateResponseQuality(chatHistory),
        emotion: calculateEmotionalExpression(chatHistory),
        problem: calculateProblemSolving(chatHistory),
        knowledge: calculateKnowledgeSharing(chatHistory)
    };
    
    return Object.values(metrics);
}

// 更新情绪趋势图表
function updateEmotionTrendChart(data) {
    emotionTrendChart.data.labels = data.labels;
    emotionTrendChart.data.datasets[0].data = data.values;
    emotionTrendChart.update();
    
    // 更新平均情绪值
    const average = data.values.reduce((a, b) => a + b, 0) / data.values.length;
    document.getElementById('averageEmotionValue').textContent = `${average.toFixed(1)}%`;
    document.getElementById('averageEmotionProgress').style.width = `${average}%`;
}

// 更新关键词饼图
function updateKeywordPieChart(data) {
    keywordPieChart.data.labels = data.labels;
    keywordPieChart.data.datasets[0].data = data.values;
    keywordPieChart.update();
    
    // 更新关键词列表
    updateKeywordList(data);
}

// 更新压力水平图表
function updateStressLevelChart(data) {
    stressLevelChart.data.datasets[0].data = data;
    stressLevelChart.update();
    
    // 更新压力指示器
    const averageStress = data.reduce((a, b) => a + b, 0) / data.length;
    const stressIndicator = document.getElementById('stressLevelIndicator');
    stressIndicator.style.setProperty('--progress', `${averageStress}%`);
    stressIndicator.querySelector('.progress-value').textContent = `${Math.round(averageStress)}%`;
}

// 更新社交互动图表
function updateSocialInteractionChart(data) {
    socialInteractionChart.data.datasets[0].data = data;
    socialInteractionChart.update();
    
    // 更新互动进度条
    const averageInteraction = data.reduce((a, b) => a + b, 0) / data.length;
    document.getElementById('interactionProgress').style.width = `${averageInteraction}%`;
}

// 更新预警信息
function updateWarnings() {
    const warningList = document.getElementById('warningList');
    warningList.innerHTML = '';
    
    const warnings = generateWarnings();
    warnings.forEach(warning => {
        const warningItem = document.createElement('div');
        warningItem.className = 'warning-item';
        warningItem.innerHTML = `
            <span class="warning-icon">${warning.icon}</span>
            <span>${warning.message}</span>
        `;
        warningList.appendChild(warningItem);
    });
    
    // 更新预警指示器
    updateAlertIndicators(warnings);
}

// 更��建议列表
function updateRecommendations() {
    const recommendationList = document.getElementById('recommendationList');
    recommendationList.innerHTML = '';
    
    const recommendations = generateRecommendations();
    recommendations.forEach(rec => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        recItem.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-icon">${rec.icon}</span>
                <span class="recommendation-title">${rec.title}</span>
            </div>
            <div class="recommendation-content">${rec.content}</div>
        `;
        recommendationList.appendChild(recItem);
    });
}

// 辅助函数
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString());
    }
    return dates;
}

function normalizeEmotionValue(sentiment) {
    return Math.min(Math.max((sentiment + 1) * 50, 0), 100);
}

function calculateInteractionFrequency(history) {
    return (history.length / 100) * 100;
}

function calculateResponseQuality(history) {
    return Math.random() * 100; // 示例实现
}

function calculateEmotionalExpression(history) {
    return Math.random() * 100; // 示例实现
}

function calculateProblemSolving(history) {
    return Math.random() * 100; // 示例实现
}

function calculateKnowledgeSharing(history) {
    return Math.random() * 100; // 示例实现
}

function generateWarnings() {
    const warnings = [];
    const emotionTrends = chatMonitor.mentalHealthData.emotionTrends;
    
    if (emotionTrends.length > 0) {
        const recentEmotions = emotionTrends.slice(-3);
        const averageEmotion = recentEmotions.reduce((a, b) => a + b.sentiment, 0) / recentEmotions.length;
        
        if (averageEmotion < -0.3) {
            warnings.push({
                type: 'emotion',
                icon: '🙁',
                message: '最近情绪波动较大，建议多关注'
            });
        }
    }
    
    return warnings;
}

function generateRecommendations() {
    return [
        {
            icon: '📚',
            title: '学习建议',
            content: '建议适当调整学习计划，保持规律作息'
        },
        {
            icon: '🎮',
            title: '休息建议',
            content: '注意劳逸结合，适当安排运动和娱乐时间'
        },
        {
            icon: '🤝',
            title: '社交建议',
            content: '可以多参与集体活动，增进同学间的交流'
        }
    ];
}

function updateAlertIndicators(warnings) {
    const indicators = document.querySelectorAll('.alert-indicator');
    indicators.forEach(indicator => {
        const type = indicator.previousElementSibling.textContent;
        const warning = warnings.find(w => w.type === type.toLowerCase());
        
        if (warning) {
            indicator.className = 'alert-indicator danger';
        } else {
            indicator.className = 'alert-indicator normal';
        }
    });
}

// 在页面加载完成后初始化图表
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('emotionTrendChart')) {
        initCharts();
        // 设置定期更新
        setInterval(updateChartData, 60000); // 每分钟更新一次
    }
});

// 更新建议按钮点击事件
function generateNewRecommendations() {
    updateRecommendations();
    const btn = document.querySelector('.action-btn');
    btn.classList.add('updating');
    setTimeout(() => btn.classList.remove('updating'), 1000);
}

// 添加复制按钮功能
document.getElementById('copyPassword').addEventListener('click', function() {
    // 创建临时输入框
    const tempInput = document.createElement('input');
    tempInput.value = DEFAULT_PARENT_PASSWORD;
    document.body.appendChild(tempInput);
    
    // 选择并复制文本
    tempInput.select();
    document.execCommand('copy');
    
    // 移除临时输入框
    document.body.removeChild(tempInput);
    
    // 显示复制成功效果
    this.classList.add('copied');
    const tooltip = this.querySelector('.copy-tooltip');
    tooltip.textContent = '已复制！';
    
    // 2秒后恢复原状
    setTimeout(() => {
        this.classList.remove('copied');
        tooltip.textContent = '复制密码';
    }, 2000);
});

// 提示点击功能
document.querySelectorAll('.hint-item').forEach(item => {
    item.addEventListener('click', function() {
        const question = this.getAttribute('data-question');
        userInput.value = question;
        userInput.focus();
    });
});

// 自动显示/隐藏提示
let hintTimeout;
userInput.addEventListener('focus', () => {
    clearTimeout(hintTimeout);
    document.querySelector('.user-hints').style.opacity = '1';
    document.querySelector('.user-hints').style.visibility = 'visible';
});

userInput.addEventListener('blur', () => {
    hintTimeout = setTimeout(() => {
        document.querySelector('.user-hints').style.opacity = '0';
        document.querySelector('.user-hints').style.visibility = 'hidden';
    }, 200);
});

// 防止点击提示时隐藏
document.querySelector('.user-hints').addEventListener('mouseenter', () => {
    clearTimeout(hintTimeout);
});

document.querySelector('.user-hints').addEventListener('mouseleave', () => {
    if (!userInput.matches(':focus')) {
        document.querySelector('.user-hints').style.opacity = '0';
        document.querySelector('.user-hints').style.visibility = 'hidden';
    }
});

// ... existing code ... 
