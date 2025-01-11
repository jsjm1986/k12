// 基础配置
const CONFIG = {
    // 年龄组设置
    ageGroupSettings: {
        '6-8': {
            vocabulary: '简单',
            maxResponseLength: 100,
            useEmoji: true,
            tone: '亲切、活泼、富有童趣'
        },
        '9-11': {
            vocabulary: '适中',
            maxResponseLength: 150,
            useEmoji: true,
            tone: '友好、耐心、循序渐进'
        },
        '12-14': {
            vocabulary: '进阶',
            maxResponseLength: 200,
            useEmoji: false,
            tone: '专业、严谨、启发思考'
        }
    },

    // 学习风格适配
    learningStyles: {
        visual: {
            useImages: true,
            useDialogue: false,
            practicalExercises: false,
            promptTemplate: '请以图文并茂的方式解释，多使用图表、示意图来辅助理解'
        },
        auditory: {
            useImages: false,
            useDialogue: true,
            practicalExercises: false,
            promptTemplate: '请以对话的形式讲解，通过语言描述和声音提示来加深理解'
        },
        interactive: {
            useImages: true,
            useDialogue: true,
            practicalExercises: true,
            promptTemplate: '请设计互动练习，通过实践和反馈来巩固学习'
        },
        reading: {
            useImages: false,
            useDialogue: false,
            practicalExercises: true,
            promptTemplate: '请提供详细的文字解释，配合阅读材料和练习题'
        },
        mixed: {
            useImages: true,
            useDialogue: true,
            practicalExercises: true,
            promptTemplate: '请综合使用多种教学方式，平衡不同的学习需求'
        }
    },

    // 难度级别适配
    difficultyLevels: {
        easy: {
            complexity: '简单',
            examples: '多',
            pace: '慢',
            promptTemplate: '请用最基础的概念解释，多举简单的例子，循序渐进'
        },
        medium: {
            complexity: '适中',
            examples: '中等',
            pace: '适中',
            promptTemplate: '请平衡理论和实践，适度提供挑战，注重理解和应用'
        },
        hard: {
            complexity: '较难',
            examples: '少而精',
            pace: '快',
            promptTemplate: '请提供深入的解释，着重培养分析和解决问题的能力'
        },
        adaptive: {
            complexity: '动态',
            examples: '灵活',
            pace: '自适应',
            promptTemplate: '请根据学生的反馈动态调整难度，在挑战和支持之间找到平衡'
        }
    },

    // 表情和语气词
    emojis: {
        happy: ['😊', '😄', '🌟', '✨', '💫'],
        thinking: ['🤔', '💭', '📝', '🔍'],
        success: ['🎉', '👏', '🌈', '⭐']
    },

    // 语气模式
    tonePatterns: {
        thinking: ['让我想想...', '我来帮你分析...', '这个问题很有趣...'],
        friendly: ['亲爱的同学，', '小朋友，', '你说得对，'],
        encouraging: ['你真棒！', '继续加油！', '做得很好！']
    },

    // 学习策略配置
    learningStrategies: {
        attention: {
            shortAttention: {
                sessionDuration: 15,
                breakInterval: 5,
                strategies: [
                    '将学习内容分成小块',
                    '使用计时器管理学习时间',
                    '每完成一个小目标给予即时奖励'
                ]
            },
            normalAttention: {
                sessionDuration: 30,
                breakInterval: 10,
                strategies: [
                    '合理安排学习任务',
                    '适时提供学习反馈',
                    '建立学习节奏'
                ]
            }
        },
        motivation: {
            needsEncouragement: {
                praiseFrequency: 'high',
                encouragementStyle: [
                    '及时表扬进步',
                    '强调努力的价值',
                    '设置小的成功目标'
                ]
            },
            selfMotivated: {
                praiseFrequency: 'moderate',
                encouragementStyle: [
                    '肯定学习成果',
                    '提供进阶挑战',
                    '培养自主学习能力'
                ]
            }
        }
    },

    // 默认设置
    defaultSettings: {
        aiName: 'K12智能教育机器人cy.waryts.com',
        aiPersonality: '友善、耐心、幽默',
        aiSubjects: ['数学', '语文', '英语', '科学'],
        greeting: '你好！我是{aiName}，很高兴见到你！让我们一起学习吧！😊',
        errorMessage: '抱歉，我现在有点累了，让我休息一下再回答你的问题吧... 🤔',
        
        // 扩展AI助手设置提示词
        systemPrompt: `作为一个教育AI助手，我将：
1. 根据学生的年龄({studentAge})调整语言难度和表达方式
2. 采用学生偏好的学习风格({learningStyle})来讲解知识
3. 保持{difficultyLevel}的难度水平
4. 重点关注学生的重点科目：{focusSubjects}
5. 注意学生的个性特点和学习目标
6. 在回答中融入鼓励和正面反馈
7. 适时提供学习建议和改进方向
8. 根据学生的知识储备调整解释深度
9. 保持耐心和友善的态度
10. 培养学生的学习兴趣和自主学习能力

学习策略调整：
1. 根据学生注意力特点({attention})安排内容节奏
2. 采用适合的激励方式({motivation})保持学习动力
3. 结合学生优势({strengths})设计学习方案
4. 针对性改善薄弱环节({weaknesses})
5. 使用学生偏好的学习方法({methods})

个性化互动原则：
1. 保持积极正面的交流态度
2. 适时给予具体的进步反馈
3. 鼓励提问和独立思考
4. 培养良好的学习习惯
5. 建立学习自信心`,

        // 扩展学生档案
        studentProfile: {
            studentAge: '9-11',
            learningStyle: 'interactive',
            difficultyLevel: 'medium',
            focusSubjects: ['数学', '语文', '英语'],
            learningGoals: {
                dailyQuestions: 10,
                dailyMinutes: 60
            },
            personalityTraits: {
                attention: '容易分心',
                interest: '对图形和动画感兴趣',
                motivation: '需要及时的正面反馈'
            },
            academicStrengths: ['空间思维', '创造力'],
            academicWeaknesses: ['记忆力', '专注力'],
            preferredMethods: ['图示学习', '互动练习', '游戏化学习'],
            
            learningHabits: {
                studyTime: '下午',
                preferredDuration: 30,
                breakPattern: '25分钟学习，5分钟休息',
                environmentNeeds: '安静的环境，适当的背景音乐'
            },
            
            interactionStyle: {
                communicationType: '喜欢互动式对话',
                feedbackPreference: '需要及时的正面反馈',
                questioningStyle: '喜欢通过提问来学习'
            },
            
            progressTracking: {
                dailyReview: true,
                weeklyReport: true,
                monthlyAssessment: true,
                preferredMetrics: ['完成任务数', '正确率', '学习时长']
            }
        },

        parentalSettings: {
            studentAge: '9-11',
            learningStyle: 'interactive',
            difficultyLevel: 'medium',
            contentFilter: {
                enabled: true,
                allowedTopics: ['学习', '知识', '科学', '艺术', '运动']
            },
            monitoring: {
                enabled: true,
                mentalHealth: {
                    enabled: true,
                    analysisFrequency: 'daily',
                    alertKeywords: {
                        anxiety: ['焦虑', '紧张', '害怕', '担心', '压力'],
                        depression: ['难过', '伤心', '孤独', '不开心', '失望'],
                        anger: ['生气', '愤怒', '讨厌', '烦躁', '不满'],
                        social: ['朋友', '同学', '老师', '欺负', '排挤'],
                        academic: ['考试', '成绩', '作业', '学习', '分数']
                    },
                    sentimentThresholds: {
                        negative: -0.5,
                        positive: 0.5
                    }
                }
            }
        }
    },

    // 学科关键词
    subjectKeywords: {
        math: ['数学', '计算', '几何', '代数'],
        chinese: ['语文', '阅读', '写作', '古诗'],
        english: ['��语', '单词', '语法', '口语'],
        science: ['科学', '实验', '物理', '化学', '生物']
    }
};

// 获取当前设置
function getCurrentSettings() {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
        return JSON.parse(savedSettings);
    }
    return CONFIG.defaultSettings;
}

// 更新设置
function updateSettings(newSettings) {
    const settings = {
        ...CONFIG.defaultSettings,
        ...newSettings
    };
    localStorage.setItem('aiSettings', JSON.stringify(settings));
    return settings;
}

// 生成AI助手提示词
function generateAIPrompt(settings) {
    const studentProfile = settings.studentProfile;
    const basePrompt = settings.systemPrompt
        .replace('{studentAge}', studentProfile.studentAge)
        .replace('{learningStyle}', studentProfile.learningStyle)
        .replace('{difficultyLevel}', studentProfile.difficultyLevel)
        .replace('{focusSubjects}', studentProfile.focusSubjects.join('、'))
        .replace('{attention}', studentProfile.personalityTraits.attention)
        .replace('{motivation}', studentProfile.personalityTraits.motivation)
        .replace('{strengths}', studentProfile.academicStrengths.join('、'))
        .replace('{weaknesses}', studentProfile.academicWeaknesses.join('、'))
        .replace('{methods}', studentProfile.preferredMethods.join('、'));

    // 添加学生特定信息
    const specificPrompt = `
特别注意事项：
1. 学生特点：${studentProfile.personalityTraits.attention}，${studentProfile.personalityTraits.interest}
2. 学习目标：每天${studentProfile.learningGoals.dailyQuestions}个问题，学习${studentProfile.learningGoals.dailyMinutes}分钟
3. 优势领域：${studentProfile.academicStrengths.join('、')}
4. 需要提升：${studentProfile.academicWeaknesses.join('、')}
5. 偏好方式：${studentProfile.preferredMethods.join('、')}

学习习惯适配：
1. 最佳学习时间：${studentProfile.learningHabits.studyTime}
2. 专注时长：${studentProfile.learningHabits.preferredDuration}分钟
3. 休息模式：${studentProfile.learningHabits.breakPattern}
4. 环境需求：${studentProfile.learningHabits.environmentNeeds}

互动方式调整：
1. 沟通方式：${studentProfile.interactionStyle.communicationType}
2. 反馈方式：${studentProfile.interactionStyle.feedbackPreference}
3. 提问方式：${studentProfile.interactionStyle.questioningStyle}`;

    return basePrompt + specificPrompt;
}

// ... existing code ... 
