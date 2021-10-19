
export interface TextMutation {
    fileName: string; // 该变化所在的文件名
    lineNumber: number; // 行号，说明这是第几行
    mutation: null | string | { // 若为null则表示删除该行，若为string则表示把整行改成这段文本
        start: number; // inclusive，要改变的文本的开始位置
        end: number; // exclusive，要改变的文本的结束位置
        content: string; // 要把以上start到end之间的文本替换为content
    };
}

// export type TextChange = Array<TextMutation>;
export type TextChange = {
    fileName: string; // 该变化所在的文件名
    // start: number; // inclusive，要改变的文本的开始位置
    // end: number; // exclusive，要改变的文本的结束位置
    content: string | null; // 要把以上start到end之间的文本替换为content
};