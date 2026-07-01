import { SolarDay, Luck, TwelveStar, God, SolarTime, ChildLimit, Gender, LunarHour } from 'tyme4ts';

// 黄历数据接口
export interface AlmanacData {
  // 公历日期
  solar: string;
  // 农历日期
  lunar: string;
  // 干支年月日
  gz: string;
  // 宜做的事
  yi: string[];
  // 忌做的事
  ji: string[];
  // 纳音
  nayin: string;
  // 冲煞
  chongsha: string;
  // 值神
  zhishen: string;
  // 时辰吉凶列表
  hourFortuneList: Array<{ hour: string; fortune: string }>;
  // 吉神宜趋
  auspicious: string[];
  // 凶神宜忌
  inauspicious: string[];
  // 胎神
  taishen: string;
  // 二十八星宿
  starSign: string;
  // 彭祖百忌
  pengzu: string;
  // 星期几
  weekday: string;
}

// 简化的黄历数据接口（用于首页展示）
export interface SimplifiedAlmanac {
  date: string;
  lunar: string;
  yi: string[];
  ji: string[];
}

// 用户信息接口
export interface UserInfo {
  name: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  [key: string]: any;
}

// 运势分析结果接口
export interface FortuneAnalysis {
  basicInfo: {
    birthDate: string;
    eightChar: string;
    gender: string;
  };
  currentCycle: {
    currentAge: number;
    decadeFortune: string;
    fortune: string;
  };
  todayAnalysis: {
    date: string;
    lunar: string;
    sixtyCycle: string;
    stemRelation: string;
    branchRelation: string;
    recommendation: string[];
    avoidance: string[];
    auspiciousGods: string[];
    inauspiciousGods: string[];
  };
  fortuneRating: number;
  fortuneDescription: string;
}

// 简化版运势数据（用于首页展示）
export interface SimplifiedFortune {
  rating: number;
  description: string;
}

// 辅助函数：将数字转换为农历日表示
function getLunarDayName(day: number): string {
  const dayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  return dayNames[day] || '初一'; // 返回 '初一' 作为后备值
}

// 辅助函数：从时辰字符串提取小时
function extractHourFromChineseHour(hourString: string): number {
  // 时辰格式如 "子时(23-1点)", "丑时(1-3点)" 等
  const match = hourString.match(/\((\d+)-\d+点\)/);
  if (match && match[1]) {
    return parseInt(match[1]);
  }
  return 8; // 默认午时
}

// 获取完整黄历数据
export function getAlmanacData(date: Date): AlmanacData {
  try {
    // 创建公历对象
    const solar = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
    
    // 获取农历信息
    const lunar = solar.getLunarDay();
    
    // 获取星期
    const week = solar.getWeek();
    
    // 格式化公历日期
    const solarString = `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${week.getName()}`;
    
    // 格式化农历日期
    const lunarMonth = lunar.getLunarMonth();
    const lunarString = `${lunarMonth.getName()}${getLunarDayName(lunar.getDay())}`;
    
    // 获取干支日
    const sixtyCycleDay = solar.getSixtyCycleDay();
    const gzString = `${sixtyCycleDay.getYear().toString()}年 ${sixtyCycleDay.getMonth().toString()}月 ${sixtyCycleDay.getSixtyCycle().toString()}日`;
    
    // 获取宜忌
    const recommends = lunar.getRecommends() || [];
    const avoids = lunar.getAvoids() || [];
    const yiActivities = recommends.map(taboo => taboo.getName());
    const jiActivities = avoids.map(taboo => taboo.getName());
    
    // 获取纳音
    const naYin = sixtyCycleDay.getSixtyCycle().getSound().toString();
    
    // 获取冲煞
    const earthBranch = sixtyCycleDay.getSixtyCycle().getEarthBranch();
    const opposite = earthBranch.getOpposite();
    const ominous = earthBranch.getOminous();
    const chongSha = `冲${opposite.getZodiac().getName()} 煞${ominous.getName()}`;
    
    // 获取值神（建除十二值神）
    const duty = lunar.getDuty();
    // 值神没有直接的吉凶方法，这里简单返回名称
    const zhiShen = duty.getName();
    
    // 获取时辰吉凶
    const hours = lunar.getHours();
    const hourFortunes = hours.map(hour => {
      const sixtyCycleHour = hour.getSixtyCycleHour();
      // 使用黄道黑道十二神判断吉凶
      const twelveStar = sixtyCycleHour.getTwelveStar();
      let fortune = '平';
      if (twelveStar) {
        const ecliptic = twelveStar.getEcliptic();
        if (ecliptic) {
          const luck = ecliptic.getLuck();
          if (luck) {
            fortune = luck.getName();
          }
        }
      }
      return {
        hour: sixtyCycleHour.getSixtyCycle().toString(),
        fortune: fortune
      };
    });
    
    // 获取吉神和凶煞
    const gods = lunar.getGods() || [];
    const jiShen = gods
      .filter(god => {
        const luck = god.getLuck();
        return luck && luck.getName() === '吉';
      })
      .map(god => god.getName());
    const xiongSha = gods
      .filter(god => {
        const luck = god.getLuck();
        return luck && luck.getName() === '凶';
      })
      .map(god => god.getName());
    
    // 获取胎神
    const fetusDay = lunar.getFetusDay();
    let taiShen = '';
    if (fetusDay) {
      const fetusHS = fetusDay.getFetusHeavenStem();
      const side = fetusDay.getSide();
      const direction = fetusDay.getDirection();
      if (fetusHS && side && direction) {
        taiShen = `${fetusHS.getName()} ${fetusDay.getName()}${direction.getName()}`;
      }
    }
    
    // 获取二十八宿
    const twentyEightStar = lunar.getTwentyEightStar();
    let starSign = '';
    if (twentyEightStar) {
      const animal = twentyEightStar.getAnimal();
      const luck = twentyEightStar.getLuck();
      starSign = `${twentyEightStar.getName()}${animal ? animal.getName() : ''} ${luck ? luck.getName() : ''}`;
    }
    
    // 获取彭祖百忌
    const pengZu = sixtyCycleDay.getSixtyCycle().getPengZu();
    let pengZuString = '';
    if (pengZu) {
      const heavenStem = pengZu.getPengZuHeavenStem();
      const earthBranch = pengZu.getPengZuEarthBranch();
      pengZuString = `${heavenStem ? heavenStem.getName() : ''} ${earthBranch ? earthBranch.getName() : ''}`;
    }
    
    return {
      solar: solarString,
      lunar: lunarString,
      gz: gzString,
      yi: yiActivities,
      ji: jiActivities,
      nayin: naYin,
      chongsha: chongSha,
      zhishen: zhiShen,
      hourFortuneList: hourFortunes,
      auspicious: jiShen,
      inauspicious: xiongSha,
      taishen: taiShen,
      starSign: starSign,
      pengzu: pengZuString,
      weekday: week.getName()
    };
  } catch (error) {
    console.error('Error generating almanac data:', error);
    
    // 返回默认数据
    return {
      solar: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}`,
      lunar: '正月初一',
      gz: '甲子年 甲子月 甲子日',
      yi: ['祭祀', '修造', '纳采'],
      ji: ['动土', '安葬'],
      nayin: '海中金',
      chongsha: '冲鼠 煞北',
      zhishen: '建',
      hourFortuneList: [
        { hour: '子', fortune: '吉' },
        { hour: '丑', fortune: '凶' },
        { hour: '寅', fortune: '吉' },
        { hour: '卯', fortune: '凶' },
        { hour: '辰', fortune: '吉' },
        { hour: '巳', fortune: '凶' },
        { hour: '午', fortune: '吉' },
        { hour: '未', fortune: '凶' },
        { hour: '申', fortune: '吉' },
        { hour: '酉', fortune: '凶' },
        { hour: '戌', fortune: '吉' },
        { hour: '亥', fortune: '凶' }
      ],
      auspicious: ['母仓', '四相'],
      inauspicious: ['天罡', '劫煞'],
      taishen: '厨灶炉 外东南',
      starSign: '牛金牛 凶',
      pengzu: '甲不开仓财物耗散 子不问卜自惹祸殃',
      weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
    };
  }
}

// 获取简化版黄历数据（用于首页）
export function getSimplifiedAlmanac(date: Date): SimplifiedAlmanac {
  try {
    const solar = SolarDay.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const lunar = solar.getLunarDay();
    
    // 格式化日期
    const dateString = `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`;
    
    // 获取宜忌
    const recommends = lunar.getRecommends() || [];
    const avoids = lunar.getAvoids() || [];
    const yiActivities = recommends.map(taboo => taboo.getName());
    const jiActivities = avoids.map(taboo => taboo.getName());
    
    return {
      date: dateString,
      lunar: `${lunar.getLunarMonth().getName()}${getLunarDayName(lunar.getDay())}`,
      yi: yiActivities,
      ji: jiActivities
    };
  } catch (error) {
    console.error('Error fetching simplified almanac data:', error);
    
    // 返回默认数据
    return {
      date: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
      lunar: '正月初一',
      yi: ['求财', '祭祀', '出行'],
      ji: ['动土', '安葬', '入宅']
    };
  }
}

/**
 * 分析今日运势
 * @param userInfo 用户信息
 * @param date 日期，默认为今天
 */
export function analyzeFortuneData(userInfo: UserInfo, date: Date = new Date()): FortuneAnalysis | null {
  try {
    if (!userInfo) {
      throw new Error('缺少用户信息');
    }

    // 从小时字符串中提取数值
    let birthHour = extractHourFromChineseHour(userInfo.birthHour);

    // 1. 创建出生时刻的公历对象
    const birthTime = SolarTime.fromYmdHms(
      parseInt(userInfo.birthYear),
      parseInt(userInfo.birthMonth),
      parseInt(userInfo.birthDay),
      birthHour,
      0, // 分钟默认为0
      0  // 秒默认为0
    );
    
    // 2. 转换为农历时辰
    const lunarHour = birthTime.getLunarHour();
    
    // 3. 获取八字
    const eightChar = lunarHour.getEightChar();
    
    // 4. 创建童限对象
    const childLimit = ChildLimit.fromSolarTime(
      birthTime,
      userInfo.gender === '男' ? Gender.MAN : Gender.WOMAN
    );
    
    // 5. 获取当前日期的公历日
    const solarDay = SolarDay.fromYmd(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    
    // 6. 获取今日农历日
    const todayLunar = solarDay.getLunarDay();
    
    // 7. 获取干支日
    const todaySixtyCycleDay = solarDay.getSixtyCycleDay();
    
    // 8. 获取今日宜忌
    const recommendActivities = todayLunar.getRecommends()?.map(taboo => taboo.getName()) || [];
    const avoidActivities = todayLunar.getAvoids()?.map(taboo => taboo.getName()) || [];
    
    // 9. 分析吉神凶煞
    const gods = todayLunar.getGods() || [];
    const auspiciousGods = gods
      .filter(god => god.getLuck()?.getName() === '吉')
      .map(god => god.getName());
    const inauspiciousGods = gods
      .filter(god => god.getLuck()?.getName() === '凶')
      .map(god => god.getName());
    
    // 10. 分析与八字的关系
    // 分析今日干支与八字的关系
    const todayHeavenStem = todaySixtyCycleDay.getSixtyCycle().getHeavenStem(); // 今日天干
    const todayEarthBranch = todaySixtyCycleDay.getSixtyCycle().getEarthBranch(); // 今日地支
    
    // 获取日主天干（日柱天干）
    const dayMasterStem = eightChar.getDay().getHeavenStem();
    
    // 分析天干关系
    const stemRelation = dayMasterStem.getTenStar(todayHeavenStem).getName();
    
    // 分析地支关系
    const branchDayMaster = eightChar.getDay().getEarthBranch();
    let branchRelation = "普通";
    
    // 检查是否相冲
    if (branchDayMaster.getOpposite()?.getName() === todayEarthBranch.getName()) {
      branchRelation = "相冲";
    } 
    // 检查是否相合
    else if (branchDayMaster.getCombine()?.getName() === todayEarthBranch.getName()) {
      branchRelation = "相合";
    } 
    // 检查是否相害
    else if (branchDayMaster.getHarm()?.getName() === todayEarthBranch.getName()) {
      branchRelation = "相害";
    }
    
    // 11. 获取当前所在大运和小运
    const currentAge = date.getFullYear() - parseInt(userInfo.birthYear) + 1; // 虚岁
    
    // 先获取起运的大运
    let decadeFortune = childLimit.getStartDecadeFortune();
    // 找到当前所在的大运
    while (decadeFortune.getEndAge() < currentAge && currentAge <= 120) {
      decadeFortune = decadeFortune.next(1);
    }
    
    // 获取当前年的小运
    let fortune = childLimit.getStartFortune();
    while (fortune.getAge() < currentAge && currentAge <= 120) {
      fortune = fortune.next(1);
    }

    // 12. 计算运势评分
    const fortuneRating = calculateFortuneRating(
      stemRelation,
      branchRelation,
      auspiciousGods.length,
      inauspiciousGods.length
    );

    // 13. 生成运势描述
    const fortuneDescription = generateFortuneDescription(
      stemRelation,
      branchRelation,
      auspiciousGods.length,
      inauspiciousGods.length,
      currentAge,
      decadeFortune,
      fortune
    );
    
    // 14. 组合形成运势报告
    return {
      basicInfo: {
        birthDate: `${userInfo.birthYear}年${userInfo.birthMonth}月${userInfo.birthDay}日 ${userInfo.birthHour}`,
        eightChar: eightChar.toString(),
        gender: userInfo.gender
      },
      currentCycle: {
        currentAge: currentAge,
        decadeFortune: decadeFortune.getSixtyCycle().toString(),
        fortune: fortune.getSixtyCycle().toString(),
      },
      todayAnalysis: {
        date: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
        lunar: todayLunar.toString(),
        sixtyCycle: todaySixtyCycleDay.toString(),
        stemRelation: stemRelation,
        branchRelation: branchRelation,
        recommendation: recommendActivities,
        avoidance: avoidActivities,
        auspiciousGods: auspiciousGods,
        inauspiciousGods: inauspiciousGods
      },
      fortuneRating,
      fortuneDescription
    };
  } catch (error) {
    console.error('Error analyzing fortune:', error);
    return null;
  }
}

/**
 * 获取简化版运势数据（用于首页展示）
 */
export function getSimplifiedFortune(userInfo: UserInfo | null): SimplifiedFortune {
  try {
    if (!userInfo) {
      throw new Error('用户信息不存在');
    }
    
    const fortune = analyzeFortuneData(userInfo);
    
    if (!fortune) {
      throw new Error('无法分析运势');
    }
    
    return {
      rating: fortune.fortuneRating,
      description: fortune.fortuneDescription
    };
  } catch (error) {
    console.error('Error generating simplified fortune:', error);
    
    // 返回默认数据
    return {
      rating: 4,
      description: '财运不错，宜投资理财。感情上注意沟通方式。'
    };
  }
}

/**
 * 计算运势评分（1-5星）
 */
function calculateFortuneRating(
  stemRelation: string,
  branchRelation: string,
  auspiciousCount: number,
  inauspiciousCount: number
): number {
  let score = 3; // 默认中等
  
  // 天干关系加分
  if (['正财', '偏财', '食神', '伤官'].includes(stemRelation)) {
    score += 1;
  } else if (['七杀', '正官'].includes(stemRelation)) {
    score -= 0.5;
  }
  
  // 地支关系加分
  if (branchRelation === '相合') {
    score += 1;
  } else if (branchRelation === '相冲') {
    score -= 1;
  } else if (branchRelation === '相害') {
    score -= 0.5;
  }
  
  // 神煞加分
  score += auspiciousCount * 0.2;
  score -= inauspiciousCount * 0.2;
  
  // 确保分数在1-5之间
  return Math.max(1, Math.min(5, Math.round(score)));
}

/**
 * 生成运势描述文本
 */
function generateFortuneDescription(
  stemRelation: string,
  branchRelation: string,
  auspiciousCount: number,
  inauspiciousCount: number,
  currentAge: number,
  decadeFortune: any,
  fortune: any
): string {
  let description = '';
  
  // 天干关系分析
  if (['正财', '偏财'].includes(stemRelation)) {
    description += '今日财运较好，适合投资理财、谈判合作。';
  } else if (['食神', '伤官'].includes(stemRelation)) {
    description += '今日创意灵感丰富，适合学习、文艺创作。';
  } else if (['正印', '偏印'].includes(stemRelation)) {
    description += '今日贵人运不错，有利于学习进修、考试等。';
  } else if (['比肩', '劫财'].includes(stemRelation)) {
    description += '今日人际关系较好，但注意财务支出。';
  } else if (['七杀', '正官'].includes(stemRelation)) {
    description += '今日宜守不宜进，办事需谨慎，避免冲动。';
  }
  
  // 地支关系分析
  if (branchRelation === '相合') {
    description += '地支相合，各方面较为顺利，有贵人相助。';
  } else if (branchRelation === '相冲') {
    description += '地支相冲，活动易受阻碍，宜谨慎行事。';
  } else if (branchRelation === '相害') {
    description += '地支相害，人际关系可能有摩擦，宜和气待人。';
  }
  
  // 吉凶神数量分析
  if (auspiciousCount > inauspiciousCount) {
    description += '今日吉神较多，总体运势良好。';
  } else if (auspiciousCount < inauspiciousCount) {
    description += '今日凶神较多，做事需谨慎，避免冒险。';
  } else {
    description += '今日吉凶参半，做事需适度，不宜过于激进。';
  }
  
  return description;
}

/**
 * 获取多日运势趋势数据
 * @param userInfo 用户信息
 * @param days 天数范围（前后各多少天）
 * @returns 运势趋势数据数组
 */
export function getFortuneTrend(userInfo: UserInfo, days: number = 7): { date: string; rating: number }[] {
  const trend: { date: string; rating: number }[] = [];
  const today = new Date();
  
  // 计算起始日期（今天减去天数）
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  
  // 计算结束日期（今天加上天数）
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);
  
  // 从起始日期到结束日期，逐天生成运势数据
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const fortune = analyzeFortuneData(userInfo, new Date(currentDate));
    
    if (fortune) {
      // 格式化日期为简短格式（如 "5/10"）
      const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
      
      trend.push({
        date: formattedDate,
        rating: fortune.fortuneRating
      });
    }
    
    // 前进一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trend;
}