// グローバル変数
let standards = null;
let currentInput = {};
let currentResult = {};

// 定数
const INCH_TO_CM = 2.54;
const LB_TO_KG = 2.20462262185;

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    await loadStandards();
    initializeEventListeners();
    setupUnitToggle();
    checkUrlParams();
    updateStandardsTable();
    setupMobileOptimizations();
});

// 基準データの読み込み
async function loadStandards() {
    try {
        const response = await fetch('./data/standards.json');
        standards = await response.json();
        updateSourceInfo();
    } catch (error) {
        console.error('基準データの読み込みに失敗しました:', error);
        showError('基準データの読み込みに失敗しました。ページを再読み込みしてください。');
    }
}

// イベントリスナーの設定
function initializeEventListeners() {
    // フォーム送信
    document.getElementById('measurementForm').addEventListener('submit', handleCalculation);
    
    // 性別変更
    document.querySelectorAll('input[name="sex"]').forEach(input => {
        input.addEventListener('change', toggleHipInput);
    });
    
    // 単位切替
    document.querySelectorAll('input[name="unitLength"], input[name="unitWeight"]').forEach(input => {
        input.addEventListener('change', handleUnitChange);
    });
    
    // 入力値の検証
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', validateInput);
    });
}

// ヒップ入力の表示/非表示
function toggleHipInput() {
    const isFemale = document.querySelector('input[name="sex"]:checked').value === 'female';
    const hipGroup = document.getElementById('hip-group');
    const hipInput = document.getElementById('hip');
    
    if (isFemale) {
        hipGroup.style.display = 'block';
        hipInput.required = true;
    } else {
        hipGroup.style.display = 'none';
        hipInput.required = false;
        hipInput.value = '';
    }
}

// 単位切替の設定
function setupUnitToggle() {
    updateUnitLabels();
}

// 単位ラベルの更新
function updateUnitLabels() {
    const lengthUnit = document.querySelector('input[name="unitLength"]:checked').value;
    const weightUnit = document.querySelector('input[name="unitWeight"]:checked').value;
    
    const lengthLabel = lengthUnit === 'metric' ? 'cm' : 'in';
    const weightLabel = weightUnit === 'metric' ? 'kg' : 'lb';
    
    document.getElementById('height-unit').textContent = lengthLabel;
    document.getElementById('neck-unit').textContent = lengthLabel;
    document.getElementById('waist-unit').textContent = lengthLabel;
    document.getElementById('hip-unit').textContent = lengthLabel;
    document.getElementById('weight-unit').textContent = weightLabel;
}

// 単位変更の処理
function handleUnitChange(event) {
    const unitType = event.target.name;
    const newUnit = event.target.value;
    
    if (unitType === 'unitLength') {
        convertLengthValues(newUnit);
    } else if (unitType === 'unitWeight') {
        convertWeightValues(newUnit);
    }
    
    updateUnitLabels();
}

// 長さの単位変換
function convertLengthValues(newUnit) {
    const lengthInputs = ['height', 'neck', 'waist', 'hip'];
    
    lengthInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input.value) {
            const currentValue = parseFloat(input.value);
            if (newUnit === 'imperial') {
                // cm to in
                input.value = (currentValue / INCH_TO_CM).toFixed(1);
            } else {
                // in to cm
                input.value = (currentValue * INCH_TO_CM).toFixed(1);
            }
        }
    });
}

// 重さの単位変換
function convertWeightValues(newUnit) {
    const weightInput = document.getElementById('weight');
    if (weightInput.value) {
        const currentValue = parseFloat(weightInput.value);
        if (newUnit === 'imperial') {
            // kg to lb
            weightInput.value = (currentValue * LB_TO_KG).toFixed(1);
        } else {
            // lb to kg
            weightInput.value = (currentValue / LB_TO_KG).toFixed(1);
        }
    }
}

// 入力値の検証
function validateInput(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    // 基本的な範囲チェック
    if (isNaN(value)) return;
    
    const lengthUnit = document.querySelector('input[name="unitLength"]:checked').value;
    const isMetric = lengthUnit === 'metric';
    
    // 入力値の妥当性チェック
    switch (input.name) {
        case 'age':
            if (value < 17 || value > 60) {
                showInputWarning(input, '年齢は17-60歳の範囲で入力してください（範囲外は参考表示）');
            }
            break;
        case 'height':
            const minHeight = isMetric ? 130 : 51;
            const maxHeight = isMetric ? 220 : 87;
            if (value < minHeight || value > maxHeight) {
                showInputWarning(input, `身長は${minHeight}-${maxHeight}${isMetric ? 'cm' : 'in'}の範囲で入力してください`);
            }
            break;
        case 'neck':
            const minNeck = isMetric ? 25 : 10;
            const maxNeck = isMetric ? 60 : 24;
            if (value < minNeck || value > maxNeck) {
                showInputWarning(input, `首囲は${minNeck}-${maxNeck}${isMetric ? 'cm' : 'in'}の範囲で入力してください`);
            }
            break;
    }
    
    updateCalculateButton();
}

// 入力警告の表示
function showInputWarning(input, message) {
    // 既存の警告を削除
    const existingWarning = input.parentNode.querySelector('.input-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // 新しい警告を追加
    const warning = document.createElement('div');
    warning.className = 'input-warning';
    warning.style.color = '#e53e3e';
    warning.style.fontSize = '0.9em';
    warning.style.marginTop = '5px';
    warning.textContent = message;
    input.parentNode.appendChild(warning);
    
    setTimeout(() => {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 5000);
}

// 計算ボタンの状態更新
function updateCalculateButton() {
    const form = document.getElementById('measurementForm');
    const button = document.getElementById('calculateBtn');
    const inputs = form.querySelectorAll('input[required]');
    
    let allValid = true;
    inputs.forEach(input => {
        if (!input.value || !input.checkValidity()) {
            allValid = false;
        }
    });
    
    button.disabled = !allValid;
}

// 計算の実行
function handleCalculation(event) {
    event.preventDefault();
    
    try {
        // 入力値の取得と正規化
        currentInput = getInputValues();
        
        // 定義域チェック
        if (!validateDomain(currentInput)) {
            return;
        }
        
        // 体脂肪率の計算
        const bodyFatPct = calculateBodyFat(currentInput);
        
        // 判定の実行
        const navyResult = judgeStandard(currentInput.sex, currentInput.age, bodyFatPct, 'Navy_2025-01');
        const marinesResult = judgeStandard(currentInput.sex, currentInput.age, bodyFatPct, 'Marines_2025-01');
        
        // BMIの計算（任意）
        const bmi = currentInput.weight ? calculateBMI(currentInput) : null;
        
        // 結果の保存
        currentResult = {
            bodyFatPct,
            bmi,
            navy: navyResult,
            marines: marinesResult
        };
        
        // 結果の表示
        displayResult(currentResult);
        
    } catch (error) {
        console.error('計算エラー:', error);
        showError('計算中にエラーが発生しました。入力値を確認してください。');
    }
}

// 入力値の取得と正規化
function getInputValues() {
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const age = parseInt(document.getElementById('age').value);
    const lengthUnit = document.querySelector('input[name="unitLength"]:checked').value;
    const weightUnit = document.querySelector('input[name="unitWeight"]:checked').value;
    
    // 長さの値を取得（インチに正規化）
    const height = parseFloat(document.getElementById('height').value);
    const neck = parseFloat(document.getElementById('neck').value);
    const waist = parseFloat(document.getElementById('waist').value);
    const hip = sex === 'female' ? parseFloat(document.getElementById('hip').value) : null;
    const weight = document.getElementById('weight').value ? parseFloat(document.getElementById('weight').value) : null;
    
    // インチに変換
    const toInches = (value) => lengthUnit === 'metric' ? value / INCH_TO_CM : value;
    const toKg = (value) => weightUnit === 'metric' ? value : value / LB_TO_KG;
    
    return {
        sex,
        age,
        height_in: toInches(height),
        neck_in: toInches(neck),
        waist_in: toInches(waist),
        hip_in: hip ? toInches(hip) : null,
        weight_kg: weight ? toKg(weight) : null,
        height_cm: lengthUnit === 'metric' ? height : height * INCH_TO_CM,
        weight: weight
    };
}

// 定義域の検証
function validateDomain(input) {
    const minDiff = 0.4; // インチ
    
    if (input.sex === 'male') {
        const diff = input.waist_in - input.neck_in;
        if (diff < minDiff) {
            showError(`男性の場合、腹囲 - 首囲 が ${minDiff} インチ（約${(minDiff * INCH_TO_CM).toFixed(1)}cm）以上である必要があります。測定方法をご確認ください。`);
            return false;
        }
    } else {
        const diff = input.waist_in + input.hip_in - input.neck_in;
        if (diff < minDiff) {
            showError(`女性の場合、腹囲 + ヒップ囲 - 首囲 が ${minDiff} インチ（約${(minDiff * INCH_TO_CM).toFixed(1)}cm）以上である必要があります。測定方法をご確認ください。`);
            return false;
        }
    }
    
    return true;
}

// 体脂肪率の計算
function calculateBodyFat(input) {
    if (input.sex === 'male') {
        // 男性の式
        return 86.010 * Math.log10(input.waist_in - input.neck_in) - 70.041 * Math.log10(input.height_in) + 36.76;
    } else {
        // 女性の式
        return 163.205 * Math.log10(input.waist_in + input.hip_in - input.neck_in) - 97.684 * Math.log10(input.height_in) - 78.387;
    }
}

// BMIの計算
function calculateBMI(input) {
    const heightM = input.height_cm / 100;
    return input.weight_kg / (heightM * heightM);
}

// 基準による判定
function judgeStandard(sex, age, bodyFatPct, presetId) {
    const preset = standards.presets.find(p => p.id === presetId);
    if (!preset) {
        throw new Error(`プリセット ${presetId} が見つかりません`);
    }
    
    // 該当する基準を検索
    const limit = preset.limits.find(l => 
        l.sex === sex && 
        age >= l.ageMin && 
        age <= l.ageMax
    );
    
    if (!limit) {
        // 年齢外の場合
        return {
            pass: null,
            limit: null,
            margin: null,
            preset: presetId,
            outOfRange: true
        };
    }
    
    const pass = bodyFatPct <= limit.limitPct;
    const margin = limit.limitPct - bodyFatPct;
    
    return {
        pass,
        limit: limit.limitPct,
        margin,
        preset: presetId,
        outOfRange: false
    };
}

// 結果の表示
function displayResult(result) {
    // パネルの表示
    document.getElementById('resultPanel').style.display = 'block';
    
    // 体脂肪率の表示
    document.getElementById('bodyFatValue').textContent = result.bodyFatPct.toFixed(1);
    
    // ゲージの更新
    updateGauge(result.bodyFatPct);
    
    // 判定結果の表示
    displayJudgement('navy', result.navy);
    displayJudgement('marines', result.marines);
    
    // BMIの表示
    if (result.bmi) {
        document.getElementById('bmiResult').style.display = 'block';
        document.getElementById('bmiValue').textContent = result.bmi.toFixed(1);
    } else {
        document.getElementById('bmiResult').style.display = 'none';
    }
    
    // 基準表の更新
    updateStandardsTable(currentInput.sex, currentInput.age);
    
    // 結果パネルまでスクロール
    document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth' });
}

// ゲージの更新
function updateGauge(bodyFatPct) {
    const gauge = document.getElementById('gaugeFill');
    const maxValue = 50; // ゲージの最大値
    const percentage = Math.min(bodyFatPct / maxValue * 100, 100);
    gauge.style.width = `${percentage}%`;
}

// 判定結果の表示
function displayJudgement(service, result) {
    const badge = document.getElementById(`${service}Badge`);
    const limitSpan = document.getElementById(`${service}Limit`);
    const marginSpan = document.getElementById(`${service}Margin`);
    
    if (result.outOfRange) {
        badge.textContent = '範囲外';
        badge.className = 'badge';
        badge.style.background = '#f3f4f6';
        badge.style.color = '#6b7280';
        limitSpan.textContent = '---';
        marginSpan.textContent = '---';
    } else {
        badge.textContent = result.pass ? '合格' : '不合格';
        badge.className = result.pass ? 'badge pass' : 'badge fail';
        limitSpan.textContent = result.limit.toFixed(1);
        marginSpan.textContent = result.margin > 0 ? `+${result.margin.toFixed(1)}` : result.margin.toFixed(1);
    }
}

// 基準表の更新
function updateStandardsTable(userSex = null, userAge = null) {
    const tbody = document.getElementById('standardsTableBody');
    tbody.innerHTML = '';
    
    if (!standards) return;
    
    standards.presets.forEach(preset => {
        preset.limits.forEach(limit => {
            const row = document.createElement('tr');
            
            // ハイライト判定
            if (userSex === limit.sex && userAge >= limit.ageMin && userAge <= limit.ageMax) {
                row.classList.add('highlight');
            }
            
            row.innerHTML = `
                <td>${preset.service}</td>
                <td>${limit.sex === 'male' ? '男性' : '女性'}</td>
                <td>${limit.ageMin}～${limit.ageMax}歳</td>
                <td>${limit.limitPct}%</td>
            `;
            
            tbody.appendChild(row);
        });
    });
}

// ソース情報の更新
function updateSourceInfo() {
    if (standards && standards.meta) {
        const sourceElement = document.getElementById('sourceInfo');
        sourceElement.textContent = `${standards.meta.source} (Version: ${standards.meta.version}, 取得日: ${standards.meta.retrieved_at})`;
    }
}

// エラーメッセージの表示
function showError(message) {
    alert(`エラー: ${message}`);
}

// URLパラメータのチェック
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('result')) {
        // 体脂肪率のみの共有
        const bodyFatPct = parseFloat(params.get('result'));
        if (!isNaN(bodyFatPct)) {
            displaySharedResult(bodyFatPct);
        }
    } else if (params.has('sex')) {
        // 全入力値の共有
        loadSharedInput(params);
    }
}

// 共有された結果の表示
function displaySharedResult(bodyFatPct) {
    document.getElementById('resultPanel').style.display = 'block';
    document.getElementById('bodyFatValue').textContent = bodyFatPct.toFixed(1);
    updateGauge(bodyFatPct);
    
    // 判定は不明として表示
    ['navy', 'marines'].forEach(service => {
        const badge = document.getElementById(`${service}Badge`);
        const limitSpan = document.getElementById(`${service}Limit`);
        const marginSpan = document.getElementById(`${service}Margin`);
        
        badge.textContent = '不明';
        badge.className = 'badge';
        badge.style.background = '#f3f4f6';
        badge.style.color = '#6b7280';
        limitSpan.textContent = '---';
        marginSpan.textContent = '---';
    });
    
    updateStandardsTable();
}

// 共有された入力値の読み込み
function loadSharedInput(params) {
    // フォームに値を設定
    const sex = params.get('sex');
    if (sex) {
        document.querySelector(`input[name="sex"][value="${sex}"]`).checked = true;
        toggleHipInput();
    }
    
    ['age', 'height', 'neck', 'waist', 'hip', 'weight'].forEach(field => {
        const value = params.get(field);
        if (value) {
            document.getElementById(field).value = value;
        }
    });
    
    // 単位の設定
    const unitLength = params.get('unitLength');
    const unitWeight = params.get('unitWeight');
    if (unitLength) {
        document.querySelector(`input[name="unitLength"][value="${unitLength}"]`).checked = true;
    }
    if (unitWeight) {
        document.querySelector(`input[name="unitWeight"][value="${unitWeight}"]`).checked = true;
    }
    
    updateUnitLabels();
    
    // 自動計算
    setTimeout(() => {
        document.getElementById('calculateBtn').click();
    }, 100);
}

// 結果の共有
function shareResult(type) {
    if (!currentResult) {
        showError('まず計算を実行してください。');
        return;
    }
    
    let url = window.location.origin + window.location.pathname;
    
    if (type === 'result-only') {
        // 体脂肪率のみ
        url += `?result=${currentResult.bodyFatPct.toFixed(1)}`;
    } else if (type === 'full') {
        // 全入力値
        const params = new URLSearchParams();
        params.set('sex', currentInput.sex);
        params.set('age', currentInput.age);
        
        // 元の単位で保存
        const lengthUnit = document.querySelector('input[name="unitLength"]:checked').value;
        const weightUnit = document.querySelector('input[name="unitWeight"]:checked').value;
        
        params.set('unitLength', lengthUnit);
        params.set('unitWeight', weightUnit);
        
        // 現在表示されている値を使用
        params.set('height', document.getElementById('height').value);
        params.set('neck', document.getElementById('neck').value);
        params.set('waist', document.getElementById('waist').value);
        
        if (currentInput.sex === 'female') {
            params.set('hip', document.getElementById('hip').value);
        }
        
        if (document.getElementById('weight').value) {
            params.set('weight', document.getElementById('weight').value);
        }
        
        url += `?${params.toString()}`;
    }
    
    // URLをクリップボードにコピー
    navigator.clipboard.writeText(url).then(() => {
        alert('共有URLをクリップボードにコピーしました。');
    }).catch(() => {
        // フォールバック：URLを表示
        prompt('共有URL:', url);
    });
}

// Xへの共有
function shareToX(type) {
    if (!currentResult) {
        showError('まず計算を実行してください。');
        return;
    }
    
    // モバイルでWeb Share APIが使える場合は優先使用
    if (navigator.share && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        if (shareWithNativeAPI(type)) {
            return;
        }
    }
    
    // 共有用のテキストとURLを生成
    const { text, url } = generateShareContent(type);
    
    // 投稿内容をプレビュー
    const confirmed = confirm(
        `以下の内容でXに投稿しますか？\n\n` +
        `投稿内容:\n${text}\n\n` +
        `URL: ${url}`
    );
    
    if (!confirmed) {
        return;
    }
    
    // X（旧Twitter）の投稿URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    // 新しいタブでX投稿画面を開く
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// 共有コンテンツの生成
function generateShareContent(type) {
    let baseUrl = window.location.origin + window.location.pathname;
    let text = '';
    let url = baseUrl;
    
    const bodyFat = currentResult.bodyFatPct.toFixed(1);
    const sex = currentInput.sex === 'male' ? '男性' : '女性';
    const age = currentInput.age;
    
    // Navy/Marinesの結果を取得
    const navyStatus = getJudgementStatus(currentResult.navy);
    const marinesStatus = getJudgementStatus(currentResult.marines);
    
    // 体脂肪率レベルの判定
    const bodyFatLevel = getBodyFatLevel(bodyFat, currentInput.sex);
    
    if (type === 'result-only') {
        // 体脂肪率のみの共有
        text = ` 体脂肪率判定結果 \n\n` +
               ` 推定体脂肪率: ${bodyFat}% ${bodyFatLevel.description}\n\n` +
               ` 海軍基準: ${navyStatus}\n` +
               ` 海兵隊基準: ${marinesStatus}\n\n` +
               `Navy Method（テープ法）で測定 \n` +
               `#体脂肪率 #NavyMethod #フィットネス #ボディメイク`;
        
        url += `?result=${bodyFat}`;
        
    } else if (type === 'full') {
        // 全データの共有
        text = ` 体脂肪率判定結果 \n\n` +
               ` ${sex} ${age}歳\n` +
               ` 推定体脂肪率: ${bodyFat}% ${bodyFatLevel.emoji}\n` +
               `${bodyFatLevel.description}\n\n` +
               ` 判定結果:\n` +
               `🇺🇸 海軍基準: ${navyStatus}\n` +
               ` 海兵隊基準: ${marinesStatus}\n\n` +
               `📐 Navy Method（テープ法）で測定\n` +
               `詳細な計算結果はこちら↓\n` +
               `#体脂肪率 #NavyMethod`;
        
        // 全入力値をURLパラメータに含める
        const params = new URLSearchParams();
        params.set('sex', currentInput.sex);
        params.set('age', currentInput.age);
        
        const lengthUnit = document.querySelector('input[name="unitLength"]:checked').value;
        const weightUnit = document.querySelector('input[name="unitWeight"]:checked').value;
        
        params.set('unitLength', lengthUnit);
        params.set('unitWeight', weightUnit);
        params.set('height', document.getElementById('height').value);
        params.set('neck', document.getElementById('neck').value);
        params.set('waist', document.getElementById('waist').value);
        
        if (currentInput.sex === 'female') {
            params.set('hip', document.getElementById('hip').value);
        }
        
        if (document.getElementById('weight').value) {
            params.set('weight', document.getElementById('weight').value);
        }
        
        url += `?${params.toString()}`;
    }
    
    return { text, url };
}

// 体脂肪率レベルの判定
function getBodyFatLevel(bodyFatPct, sex) {
    if (sex === 'male') {
        if (bodyFatPct < 6) return { emoji: '🔥', description: 'エッセンシャル脂肪（極低体脂肪）' };
        else if (bodyFatPct < 14) return { emoji: '💪', description: 'アスリートレベル（超低体脂肪）' };
        else if (bodyFatPct < 18) return { emoji: '✨', description: 'フィットネスレベル（低体脂肪）' };
        else if (bodyFatPct < 25) return { emoji: '👍', description: '健康的（標準体脂肪）' };
        else return { emoji: '⚠️', description: '要注意（高体脂肪）' };
    } else {
        if (bodyFatPct < 16) return { emoji: '🔥', description: 'エッセンシャル脂肪（極低体脂肪）' };
        else if (bodyFatPct < 20) return { emoji: '💪', description: 'アスリートレベル（超低体脂肪）' };
        else if (bodyFatPct < 25) return { emoji: '✨', description: 'フィットネスレベル（低体脂肪）' };
        else if (bodyFatPct < 32) return { emoji: '👍', description: '健康的（標準体脂肪）' };
        else return { emoji: '⚠️', description: '要注意（高体脂肪）' };
    }
}

// 判定ステータスの取得
function getJudgementStatus(result) {
    if (result.outOfRange) {
        return '範囲外';
    } else if (result.pass) {
        return `合格 (${result.margin > 0 ? '+' : ''}${result.margin.toFixed(1)}%pt)`;
    } else {
        return `不合格 (${result.margin.toFixed(1)}%pt)`;
    }
}

// 測定ガイドの表示
function showMeasurementGuide(type) {
    const modal = document.getElementById('measurementModal');
    const content = document.getElementById('modalContent');
    
    let guideContent = '';
    
    switch (type) {
        case 'neck':
            guideContent = `
                <h3>首囲の測定方法</h3>
                <div style="margin: 20px 0;">
                    <h4>正しい測定方法:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>喉仏の下の最も細い部分で測定</li>
                        <li>メジャーは水平に保つ</li>
                        <li>自然な姿勢で、顔は正面を向く</li>
                        <li>メジャーは軽く肌に触れる程度</li>
                    </ul>
                    <h4>注意事項:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #e53e3e;">
                        <li>強く締めすぎない</li>
                        <li>衣服の上から測定しない</li>
                        <li>メジャーを傾けない</li>
                    </ul>
                </div>
            `;
            break;
        case 'waist':
            guideContent = `
                <h3>腹囲の測定方法</h3>
                <div style="margin: 20px 0;">
                    <h4>正しい測定方法:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>へそ（臍）の高さで測定</li>
                        <li>自然な呼気終末（息を軽く吐いた状態）</li>
                        <li>メジャーは水平に保つ</li>
                        <li>自然な姿勢で立つ</li>
                    </ul>
                    <h4>注意事項:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #e53e3e;">
                        <li>お腹を引っ込めない</li>
                        <li>息を止めない</li>
                        <li>メジャーを強く締めない</li>
                    </ul>
                </div>
            `;
            break;
        case 'hip':
            guideContent = `
                <h3>ヒップ囲の測定方法</h3>
                <div style="margin: 20px 0;">
                    <h4>正しい測定方法:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>臀部の最も大きい部分で測定</li>
                        <li>横から見て最も突出した部分</li>
                        <li>メジャーは水平に保つ</li>
                        <li>自然な姿勢で立つ</li>
                    </ul>
                    <h4>注意事項:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #e53e3e;">
                        <li>衣服の上から測定しない</li>
                        <li>メジャーを傾けない</li>
                        <li>測定位置を間違えない</li>
                    </ul>
                </div>
            `;
            break;
    }
    
    content.innerHTML = guideContent;
    modal.style.display = 'block';
}

// 測定ガイドを閉じる
function closeMeasurementGuide() {
    document.getElementById('measurementModal').style.display = 'none';
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const modal = document.getElementById('measurementModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// モバイル最適化
function setupMobileOptimizations() {
    // デバイス判定
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android.*(?!.*Mobile)|tablet/i.test(navigator.userAgent);
    
    if (isMobile || isTablet) {
        // モバイル向けの追加処理
        setupTouchOptimizations();
        setupKeyboardOptimizations();
    }
    
    // 画面回転対応
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // タッチデバイス向けのスクロール最適化
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
}

// タッチ最適化
function setupTouchOptimizations() {
    // 数値入力フィールドにスピナーボタンを追加（モバイル向け）
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        // モバイルでは数値キーパッドを強制表示
        input.setAttribute('inputmode', 'decimal');
        input.setAttribute('pattern', '[0-9]*');
    });
    
    // 長押しでヘルプを表示する機能
    const helpButtons = document.querySelectorAll('.help-btn');
    helpButtons.forEach(button => {
        let touchTimer;
        
        button.addEventListener('touchstart', function(e) {
            touchTimer = setTimeout(() => {
                const measurementType = button.getAttribute('onclick').match(/'(\w+)'/)[1];
                showMeasurementGuide(measurementType);
            }, 500);
        });
        
        button.addEventListener('touchend', function() {
            clearTimeout(touchTimer);
        });
        
        button.addEventListener('touchmove', function() {
            clearTimeout(touchTimer);
        });
    });
}

// キーボード最適化
function setupKeyboardOptimizations() {
    // iOS Safari でのズーム防止
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type === 'number') {
            input.style.fontSize = '16px';
        }
    });
    
    // バーチャルキーボード表示時の画面調整
    let initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', function() {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        // キーボードが表示されていると判断
        if (heightDifference > 150) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    });
}

// 画面回転時の処理
function handleOrientationChange() {
    setTimeout(() => {
        // レイアウトの再計算を促す
        window.dispatchEvent(new Event('resize'));
        
        // ゲージの再描画
        if (currentResult && currentResult.bodyFatPct) {
            updateGauge(currentResult.bodyFatPct);
        }
    }, 100);
}

// Web Share API（対応デバイスのみ）
function shareWithNativeAPI(type) {
    if (navigator.share && currentResult) {
        const { text, url } = generateShareContent(type);
        
        navigator.share({
            title: '体脂肪率判定結果',
            text: text,
            url: url
        }).catch((error) => {
            console.log('共有がキャンセルされました:', error);
        });
        
        return true;
    }
    return false;

}
