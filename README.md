# OpticsArt 光学视觉艺术协会 · 静态官网

瑞士国际主义风格的极简摄影 / 视觉艺术展示站。**纯静态站点（无任何后端服务器）**，内容与图片全部存放在 GitHub 仓库中，通过 jsDelivr CDN 分发。

- 首页：当前活动海报全屏自动轮播 + 顶部 Banner 菜单
- 顶部 Banner：可在后台配置为「具体摄影师 / 具体活动项目 / 具体线上展览 / 后台 / 外链」
- 后台：浏览器端 Git CMS，登录后所有增删改直接提交为 Git commit

---

## 一、工作原理

| 角色 | 数据流向 |
| --- | --- |
| 访客（前台） | 浏览器 → **jsDelivr CDN** → 仓库中的 `data/db.json` 与 `data/uploads/*` |
| 管理员（后台） | 浏览器 → **GitHub Contents API**（用 Token）→ 直接写 `data/db.json` / 提交图片 |

- 前台读取走 CDN，速度快；后台读写走 GitHub API，保证拿到最新内容。
- 后台每次保存 = 一次 Git 提交，仓库历史就是完整的内容版本记录。
- Token 只保存在管理员自己的浏览器 localStorage，**不会写入仓库、不上传第三方**。

## 二、部署到 GitHub Pages（四步）

### 1. 创建仓库并推送代码

先在 GitHub 新建一个**空仓库**（不要勾选初始化 README），然后在项目目录执行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

请确保仓库包含：

- `data/db.json` —— 站点内容（作品 / 摄影师 / 展览 / 活动 / 导航架构）
- `data/uploads/` —— 图片资源
- `.github/workflows/deploy.yml` —— 自动构建部署

### 2. 开启 GitHub Pages

仓库 **Settings → Pages → Source**，选择 **GitHub Pages（GitHub Actions）**。
推送后 Actions 会自动构建发布，完成后在 **Actions** 页面查看部署地址。

> 项目站点地址形如 `https://<用户名>.github.io/<仓库名>/`。
> 本项目资源路径已配置为相对路径（`vite.config.ts` 中 `base: './'`），根域与子路径均可正常访问。

### 3. 生成 Token（Fine-grained Personal Access Token）

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Resource owner** 选你的账号；**Repository access** 选「Only select repositories」→ 勾选本仓库
3. **Permissions → Repository permissions → Contents** 设为 **Read and write**
4. 生成后复制 token（以 `github_pat_` 开头）

### 4. 在后台完成连接

打开站点后台（站点地址后加 `/#/admin`），填写：

- 拥有者 owner（例如 `your-name`）
- 仓库名 repo（例如 `opticsart-site`）
- 分支 branch（通常 `main`）
- 上面生成的 Token

连接成功后即可管理全部内容，**无需再次部署**。

## 三、日常使用

- **改内容**：直接在后台操作，保存即提交到仓库，前台通常**数分钟内**经 CDN 生效。
- **改代码 / 样式**：本地修改后 `git push`，Actions 自动重新部署。
- **备份与回滚**：内容即仓库，`git clone` 就是完整备份；可在提交历史中随时回滚。

## 四、本地开发

```bash
npm install
npm run dev        # 本地预览（未连接仓库时读取 public/data/db.json 兜底数据）
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 五、目录说明

| 路径 | 说明 |
| --- | --- |
| `src/pages/` | 前台页面（首页轮播、浏览、作品详情、展览、摄影师、活动详情等） |
| `src/components/` | 通用组件（`PosterCarousel` 海报轮播、`PublicLayout` 顶部 Banner 等） |
| `src/admin/` | 后台（`CollectionManager` 通用集合管理、`NavManager` 导航架构、`AdminApp` 登录与框架） |
| `src/lib/api.ts` | 数据层：CDN 读取 + GitHub 写入 |
| `src/lib/gh.ts` | GitHub Contents API 封装 |
| `src/lib/config.ts` | 仓库连接配置（localStorage） |
| `data/db.json` | **站点内容数据源** |
| `data/uploads/` | **图片数据源**（支持 2560px / 2K 分辨率） |
| `public/data/`、`public/uploads/` | 未连接仓库时的兜底数据（构建产物内置） |

## 六、图片说明

- 后台上传时图片会在浏览器端压缩至**长边 2560px（2K）**、JPEG 质量 0.9，兼顾清晰度与加载速度。
- 图片由 GitHub 仓库 + jsDelivr 托管，无需第三方图床或额外密钥。

> 若需要 4K（3840px）存储，调整 `src/components/ImageField.tsx` 中的 `MAX_DIM` 即可。
> 线上地址（GitHub Pages）：https://owleryimage.github.io/opticsart/
