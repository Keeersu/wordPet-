# Asset Slot Checklist

这份清单用于管理前端中“后期补切图”的位置。

统一规则：

- 有图时：使用纯图片模式，不再叠加默认占位壳层
- 无图时：回退到颜色占位、emoji 占位或文字占位
- 当前本地资源状态：`frontend` 目录下尚未发现实际 `assets` 图片文件

## 当前已统一为“图片优先，缺失回退”的位置

| 页面/组件 | 资源用途 | 资源路径 | 当前回退方式 | 代码位置 |
|---|---|---|---|---|
| `Home` | 右下 FAB 主按钮 | `/assets/ui/buttons/btn-quick-start.png` | 图片失败时回退到橙色圆形按钮壳 | `src/pages/function/Home.tsx` |
| `Home` | 设置弹窗背景 | `/assets/ui/settings-bg.png` | 图片失败时显示黄色底图 | `src/pages/function/Home.tsx` |
| `MainTabBar` | 底部 3 个 tab 图标 | `/assets/ui/icons/icon-{id}.png` | 图片失败时保留彩色圆形按钮占位 | `src/components/function/MainTabBar.tsx` |
| `Splash` | App Logo | `/assets/ui/logo.png` | 图片失败时显示 `🐱` | `src/pages/function/Splash.tsx` |
| `Room` | 房间背景图 | `/assets/rooms/ch{id}/bg.jpg` | 图片失败时显示房间背景色 + “房间背景图占位” | `src/pages/function/Room.tsx` |
| `Room` | 房间主家具图 | `/assets/rooms/ch{id}/furniture/lv1/full.png` | 图片失败时显示家具 emoji | `src/pages/function/Room.tsx` |
| `Room` | 关卡右侧家具图 | `/assets/rooms/ch{id}/furniture/lv{levelId}/full.png` | 图片失败时显示家具名称首字占位；未解锁时显示 `❓` | `src/pages/function/Room.tsx` |
| `Onboarding` | 猫咪大预览 | `/assets/cat/appearance_{appearance}_{personality}_{m|f}.png` | 图片失败时显示橙色圆底 + `🐱` | `src/pages/function/Onboarding.tsx` |
| `Onboarding` | 外观选项缩略图 | `/assets/onboarding/cat/appearance_{id}.png` | 图片失败时显示色块占位 | `src/pages/function/Onboarding.tsx` |

## 代码中已声明但仍建议继续关注的位置

这些位置虽然已有图片路径或注释，但后续联调时建议继续核对实际资源是否齐全、命名是否一致。

| 页面/组件 | 资源用途 | 资源路径 | 备注 |
|---|---|---|---|
| `Result` | 家具奖励图 | `/assets/rooms/ch{chapterId}/furniture/lv{levelId}/full.png` | 与 `Room` 页家具资源同源，建议后续确认是否也需要同样回退策略 |
| `FurnitureReveal` | 家具展示图 | `/assets/rooms/ch{id}/furniture/lv{levelId}/full.png` | 类型定义里已约定路径，后续页面实现时沿用同一规则 |

## 推荐的落图目录结构

```text
frontend/
  public/
    assets/
      ui/
        logo.png
        settings-bg.png
        buttons/
          btn-quick-start.png
        icons/
          icon-collection.png
          icon-practice.png
          icon-profile.png
      cat/
        appearance_1_homebody_f.png
        appearance_1_homebody_m.png
        ...
      onboarding/
        cat/
          appearance_1.png
          appearance_2.png
          appearance_3.png
          appearance_4.png
      rooms/
        ch1/
          bg.jpg
          furniture/
            lv1/full.png
            lv2/full.png
            lv3/full.png
            lv4/full.png
        ch2/
          ...
```

## 后续替换建议

1. 优先把 `Home` 的 `FAB`、`MainTabBar`、`Splash Logo` 补齐，这三处最影响首屏观感。
2. `Room` 相关资源按章节批量补图，最适合一次性整理命名。
3. `Onboarding` 预览图建议最后补，因为它依赖外观、性格、性别组合，资源数最多。

## 替换完成后的检查清单

- 刷新首页，确认 `FAB` 不再显示橙色占位壳
- 检查 `MainTabBar` 三个按钮是否都进入纯图片模式
- 检查 `Splash` 页 Logo 是否替代 `🐱`
- 检查 `Room` 页背景图、家具图是否不再出现占位文案/emoji
- 检查 `Onboarding` 页预览与外观缩略图是否均显示真实图片
