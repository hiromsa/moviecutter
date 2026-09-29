/**
 * アプリケーションのバージョン情報管理
 * .clinerules の運用ルールに準拠:
 * v<Major>.<Minor>.<Patch>-beta.<CommitCount>+<ShortHash>
 */

export const APP_MAJOR = 0;
export const APP_MINOR = 0;
export const APP_PATCH = 1;
export const APP_BUILD_NUMBER = 4;
export const APP_COMMIT_HASH = '7224c84';

export const APP_VERSION_SHORT = `v${APP_MAJOR}.${APP_MINOR}.${APP_PATCH}-beta.${APP_BUILD_NUMBER}`;
export const APP_VERSION_FULL = `${APP_VERSION_SHORT}+${APP_COMMIT_HASH}`;
export const APP_VERSION_DETAIL = `${APP_VERSION_SHORT} (${APP_COMMIT_HASH})`;
