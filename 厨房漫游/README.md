# 归家 · 厨房漫游

根据 `厨房.jpg`、`厨房门口的灯.jpg` 与 `户型图.png` 搭建的 Three.js 厨房空间。方向按用户确认调整为灶台所在后墙短边约 2.06 m、东西侧长边约 3.08 m；尺寸按照片比例适配，不用于施工。

三面墙铺满棕色菱形花砖。2026-10-13 按新照片将厨房地面改为砖红与米白交错的 30 cm 方砖，入口铺三排蓝、绿、米白与浅赭色马赛克过渡带。尺寸按图片比例估算。

## 启动

双击 `启动厨房漫游.cmd`，或在此目录运行 `npm install` 后运行 `npm run dev`。页面地址为 `http://127.0.0.1:5180`。

## 操作

- 拖动环顾，滚轮缩放；底部按钮切换全景、灶台、水槽和俯视角。
- 点选右侧物件清单聚焦相应位置；右上切换自然光/夜景、查看参考照片。
- 本次单独生成并接入白色侧吸油烟机、双头燃气灶、不粘锅、高压锅和水槽上柜，与已有入口吊灯共六个独立模型。左灶放不粘锅，右灶放高压锅；上柜在东侧水槽上方。
- 其余厨房场景保持完整的程序化模型，不再批量下载替换，避免卡顿和局部错位。
- 物件、生成记录与模型编号见 `模型生成记录.md`；尺寸按照片比例适配，属于可视化估算。

## 本次独立模型

打开 `/model-check.html`，通过下拉菜单切换五件模型。文件位于 `public/assets/`，命名为 `white-hood-v2.glb`、`two-burner-hob-v2.glb`、`nonstick-pan-v2.glb`、`pressure-cooker-v2.glb`、`sink-upper-cabinet-v2.glb`。

模型使用各自的独立参考图生成，记录见 [生成提示词与编号](model-generation-2026-10-13.json)。油烟机参考图先按用户图片改为白色；后续补齐烟道连接，双头灶修正轴向与嵌入厚度。网页提供「剖开墙顶」按钮查看内部，点击可恢复完整墙顶。

缺图物件的外观参考来源：[白色上柜](https://www.homedepot.com/p/325134695)、[双头灶](https://vees.com.my/product/vees-premium-gas-hob-vgh-2388-2b-bk/)、[不粘锅](https://www.tefal.com.au/products/tefal-simple-cook-non-stick-frypan-30cm)、[高压锅](https://www.daraz.com.bd/products/prestige-stainless-steel-pressure-cooker-3-litre-i321448532.html)。这些参考仅用于补足外形，不代表照片中的实际品牌。
