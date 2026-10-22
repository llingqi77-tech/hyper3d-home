$ErrorActionPreference='Stop'
$workspace='D:/3d家园'
$temporaryImages='C:/Users/admin/AppData/Local/Temp'
$kitchen='厨房漫游/public/references'
$bathroom='公卫1漫游/public/references'
$entries=@(
@('51fe05fe-e4c3-4fed-b648-e3ceefa916ac','png',$kitchen,'初次加载厨房截图'),
@('02fcd086-cbc0-4b4a-884d-19d87245a7c3','png',$kitchen,'模型加载后厨房截图'),
@('a5bfa2c7-a4b3-4cff-b1e2-7d9593863176','png',$kitchen,'厨房墙面花砖参考'),
@('418f0a32-e12a-4e67-a7c7-c0800b883e8f','jpg',$kitchen,'厨房地砖实拍'),
@('998ab746-2535-42ca-af13-d6c9812ae407','jpg',$kitchen,'厨房餐厅过渡拼花实拍'),
@('244a4065-5327-4e24-823f-f42a49474e18','png',$kitchen,'侧吸油烟机造型参考'),
@('8d99e1ce-dbbd-4a4e-962f-781b0cfac08a','png',$bathroom,'公卫布局草图'),
@('4610cf8e-fb0b-4e60-8afb-63bf0dcf3396','png',$bathroom,'公卫确认布局图'),
@('46a9b6b3-4667-4826-b8b9-90bca520072b','png',$bathroom,'公卫摆放问题截图'),
@('a13645b4-2f96-44d3-b7d8-bb6fe2b265b9','png',$bathroom,'白色柜架调整截图'),
@('d24b1ce9-cec5-473d-8889-b3bd6c21e2bc','png',$bathroom,'替换镜子位置截图'),
@('9efadd9a-416e-46de-8396-e7f439083bd6','png',$bathroom,'错误台盆模型截图'),
@('f44e46cf-1be9-4e44-abb7-992512b523c5','png',$bathroom,'洗手液瓶原位置'),
@('b289a39a-7c99-4db0-8eae-710d88ef315e','png',$bathroom,'洗手液瓶目标墙角'),
@('d65d201b-f503-482a-9f78-bd4e8b2bb157','png',$bathroom,'黑色顶喷手持花洒参考'),
@('cfb7d818-6a42-4fda-8787-c09e7ed70744','png',$bathroom,'墙裙瓷砖调整截图')
)
$records=@()
foreach($entry in $entries){
  $name='codex-clipboard-'+$entry[0]+'.'+$entry[1]
  $source=Join-Path $temporaryImages $name
  $relative=$entry[2]+'/user-uploads/'+$name
  $destination=Join-Path $workspace $relative
  if(Test-Path -LiteralPath $source){
    New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination
    $records+= [pscustomobject]@{file=$relative;description=$entry[3];status='copied';sha256=(Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash}
  }else{$records+=[pscustomobject]@{file=$relative;description=$entry[3];status='missing';sha256=$null}}
}
foreach($entry in @(@('厨房.jpg',$kitchen),@('厨房门口的灯.jpg',$kitchen),@('餐厅.jpg',$kitchen),@('户型图.png',$kitchen),@('厕所的柜子.jpg',$bathroom),@('公卫1.jpg',$bathroom),@('洗手台.jpg',$bathroom),@('公卫1的洗手台.jpg',$bathroom),@('公卫1洗手台上的灯.jpg',$bathroom),@('厕所柜子+镜子.jpg',$bathroom))){
  $relative=$entry[1]+'/user-uploads/'+$entry[0]
  $destination=Join-Path $workspace $relative
  Copy-Item -LiteralPath (Join-Path $workspace $entry[0]) -Destination $destination
  $records+=[pscustomobject]@{file=$relative;description=$entry[0];status='copied';sha256=(Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash}
}
foreach($room in @($kitchen,$bathroom)){
  $records | Where-Object {$_.file.StartsWith($room+'/')} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $workspace ($room+'/user-uploads/index.json')) -Encoding utf8
}
$records | Select-Object description,status,file | Format-Table -AutoSize
