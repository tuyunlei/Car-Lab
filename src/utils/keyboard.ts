
/**
 * 键盘事件工具函数
 * 提供键盘事件处理的通用功能
 */

/**
 * 检查按键是否为修饰键
 */
export function isModifierKey(code: string): boolean {
    return (
        code === 'ShiftLeft' ||
        code === 'ShiftRight' ||
        code === 'ControlLeft' ||
        code === 'ControlRight' ||
        code === 'AltLeft' ||
        code === 'AltRight' ||
        code === 'MetaLeft' ||
        code === 'MetaRight'
    );
}

/**
 * 检查是否为 Shift 键
 */
export function isShiftKey(code: string): boolean {
    return code === 'ShiftLeft' || code === 'ShiftRight';
}

/**
 * 检查是否为 Ctrl 键
 */
export function isCtrlKey(code: string): boolean {
    return code === 'ControlLeft' || code === 'ControlRight';
}

/**
 * 检查是否为 Alt 键
 */
export function isAltKey(code: string): boolean {
    return code === 'AltLeft' || code === 'AltRight';
}

/**
 * 将键盘事件转换为标准化的按键字符串
 *
 * @description
 * 生成格式如 "Shift+KeyW", "Ctrl+Alt+KeyA" 的字符串
 * 用于键位绑定的存储和比对
 */
export function getEventKeyString(e: KeyboardEvent): string {
    const parts: string[] = [];

    // 添加修饰键（排除当前按下的是修饰键本身的情况）
    if (e.shiftKey && !isShiftKey(e.code)) {
        parts.push('Shift');
    }
    if (e.ctrlKey && !isCtrlKey(e.code)) {
        parts.push('Ctrl');
    }
    if (e.altKey && !isAltKey(e.code)) {
        parts.push('Alt');
    }

    // 添加主按键
    parts.push(e.code);

    return parts.join('+');
}
