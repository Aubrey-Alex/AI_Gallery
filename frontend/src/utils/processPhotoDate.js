// src/utils/processPhotoDate.js
import exifr from 'exifr';

/**
 * 读取图片真实拍摄时间
 * 策略：
 * 1. 尝试读取 EXIF
 * 2. 修正安卓拍摄的"未来时间" Bug (UTC vs Local 误判)
 * 3. 回退到 lastModified
 */
export const getPhotoDate = async (file) => {
    // 获取当前时间（用于比对是否为未来时间）
    // 允许 1 分钟的误差，防止两台设备时间微小差异
    const now = new Date();
    const futureThreshold = new Date(now.getTime() + 60 * 1000);

    let date = null;

    try {
        // 1. 尝试读取 EXIF
        const metadata = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate', 'OffsetTimeOriginal']);

        if (metadata && (metadata.DateTimeOriginal || metadata.CreateDate)) {
            // EXIF 解析出的时间对象
            let exifDate = new Date(metadata.DateTimeOriginal || metadata.CreateDate);

            // 【核心修复】：检查是否发生了"双重时区叠加"（即显示为未来时间）
            // 现象：如果是安卓拍摄，exifDate 可能会比 now 快 8 小时（或你的时区偏移量）
            if (exifDate > futureThreshold) {
                console.warn('检测到 EXIF 时间在未来，可能是安卓时区解析错误，尝试修正...');

                // 获取本地时区偏移量（分钟），例如中国是 -480 (UTC+8)
                const timezoneOffsetMinutes = new Date().getTimezoneOffset();

                // 尝试修正：减去这个时区偏移（注意 getTimezoneOffset 符号是反的）
                // 如果 JS 认为是 UTC，加了 8 小时，我们需要减回去
                // 但更简单的逻辑是：如果 EXIF 坏了，直接丢弃，用文件修改时间

                // 方案 A: 尝试修正（风险较高，因为不知道具体偏了多少）
                // 方案 B: 既然是实时拍摄，文件修改时间(lastModified)一定是最准确的"现在"
                console.warn('放弃异常的 EXIF 时间，回退到文件修改时间');
                date = null; // 标记为无效，通过下方的逻辑回退
            } else {
                date = exifDate;
            }
        }
    } catch (error) {
        console.warn('EXIF 读取失败', error);
    }

    // 2. 如果 EXIF 读取失败，或者读取到了未来时间被我们要置空了
    if (!date) {
        // file.lastModified 是时间戳数字
        // 对于安卓实时拍摄，这个时间就是"刚才"，非常准确
        date = new Date(file.lastModified);
    }

    // 3. 双重保险：如果回退后还是未来时间（极少见），强制设为当前时间
    if (date > futureThreshold) {
        date = new Date();
    }

    return date;
};