# 04：API 设计与清单

> API 清单是源码静态扫描结果。Request/Response 只有在控制器或接口签名可直接确认时才记录；没有静态证据的字段标为 `UNKNOWN`。

后端 API：**164**；前端 API 函数：**252**。

## Backend API Inventory

| API ID | Area | Method | Route | Controller | Method | Auth | Service refs | Request/Response | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-CAR-GETPAGECARLIST | Car | POST | /Car/GetPageCarList | CarController | GetPageCarList | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:69 |
| API-CAR-GETCARDETAILBYAGVID | Car | GET | /Car/GetCarDetailByAgvId | CarController | GetCarDetailByAgvId | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:124 |
| API-CAR-GETALLCARDATA | Car | GET | /Car/GetAllCarData | CarController | GetAllCarData | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:167 |
| API-CAR-ADDCAR | Car | POST | /Car/AddCar | CarController | AddCar | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:194 |
| API-CAR-UPDATECAR | Car | POST | /Car/UpdateCar | CarController | UpdateCar | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:286 |
| API-CAR-DELETECAR | Car | POST | /Car/DeleteCar | CarController | DeleteCar | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:345 |
| API-CAR-GETPAGECARCLASSNAME | Car | GET | /Car/GetPageCarClassName | CarController | GetPageCarClassName | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:406 |
| API-CAR-GETALLCARLIST | Car | GET | /Car/GetAllCarList | CarController | GetAllCarList | RequiresToken | ICarService<br>IMapService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarController.cs:481 |
| API-CAR-GETCARSUBCLASS | Car | GET | /Car/GetCarSubClass | CarExtendController | GetCarSubClass | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarExtendController.cs:23 |
| API-CAR-GETCARCLASS | Car | GET | /Car/GetCarClass | CarExtendController | GetCarClass | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarExtendController.cs:55 |
| API-CAR-GETPAGEVEHICLECLASSNAME | Car | GET | /Car/GetPageVehicleClassName | CarExtendController | GetPageVehicleClassName | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Car/CarExtendController.cs:85 |
| API-ACCOUNT-LOGIN | Employee | POST | /Account/Login | AccountController | Login | not observed | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/AccountController.cs:50 |
| API-ACCOUNT-LOGOUT | Employee | POST | /Account/Logout | AccountController | Logout | not observed | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/AccountController.cs:83 |
| API-ACCOUNT-INFO | Employee | GET | /Account/Info | AccountController | Info | not observed | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/AccountController.cs:123 |
| API-MENU-GETMENUTREE | Employee | GET | /Menu/GetMenuTree | MenuController | GetMenuTree | RequiresToken | IMenuService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/MenuController.cs:42 |
| API-MENU-GETMENUBYID | Employee | GET | /Menu/GetMenuById | MenuController | GetMenuById | RequiresToken | IMenuService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/MenuController.cs:66 |
| API-MENU-SAVEMENU | Employee | POST | /Menu/SaveMenu | MenuController | SaveMenu | RequiresToken | IMenuService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/MenuController.cs:104 |
| API-MENU-DELETEMENU | Employee | GET | /Menu/DeleteMenu | MenuController | DeleteMenu | RequiresToken | IMenuService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/MenuController.cs:148 |
| API-MENU-GETMENUBYPOWERTREE | Employee | GET | /Menu/GetMenuByPowerTree | MenuController | GetMenuByPowerTree | RequiresToken | IMenuService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/MenuController.cs:179 |
| API-ROLE-GETROLEPAGE | Employee | POST | /Role/GetRolePage | RoleController | GetRolePage | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:47 |
| API-ROLE-SAVEROLE | Employee | POST | /Role/SaveRole | RoleController | SaveRole | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:89 |
| API-ROLE-GETRULEUSER | Employee | GET | /Role/GetRuleUser | RoleController | GetRuleUser | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:133 |
| API-ROLE-GETUSERROLE | Employee | GET | /Role/GetUserRole | RoleController | GetUserRole | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:157 |
| API-ROLE-GETROLE | Employee | GET | /Role/GetRole | RoleController | GetRole | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:181 |
| API-ROLE-GETROLELIST | Employee | POST | /Role/GetRoleList | RoleController | GetRoleList | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:205 |
| API-ROLE-GETALLUSER | Employee | POST | /Role/GetAllUser | RoleController | GetAllUser | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:242 |
| API-ROLE-GETUSERBYROLE | Employee | GET | /Role/GetUserByRole | RoleController | GetUserByRole | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:279 |
| API-ROLE-SAVEROLEUSER | Employee | POST | /Role/SaveRoleUser | RoleController | SaveRoleUser | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:312 |
| API-ROLE-DELETEROLE | Employee | GET | /Role/DeleteRole | RoleController | DeleteRole | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:351 |
| API-ROLE-GETROLEPERMISSIONSDATA | Employee | POST | /Role/GetRolePermissionsData | RoleController | GetRolePermissionsData | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:381 |
| API-ROLE-SAVEROLEPERMISSIONS | Employee | POST | /Role/SaveRolePermissions | RoleController | SaveRolePermissions | RequiresToken | IRoleService<br>ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/RoleController.cs:406 |
| API-STRATEGY-GETPAGESTRATEGYLIST | Employee | POST | /Strategy/GetPageStrategyList | StrategyController | GetPageStrategyList | RequiresToken | IStrategyService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/StrategyController.cs:43 |
| API-STRATEGY-ADDSYSSTRATEGY | Employee | POST | /Strategy/AddSysStrategy | StrategyController | AddSysStrategy | RequiresToken | IStrategyService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/StrategyController.cs:87 |
| API-STRATEGY-UPDATESYSSTRATEGY | Employee | POST | /Strategy/UpdateSysStrategy | StrategyController | UpdateSysStrategy | RequiresToken | IStrategyService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/StrategyController.cs:155 |
| API-STRATEGY-DELETESYSSTRATEGY | Employee | POST | /Strategy/DeleteSysStrategy | StrategyController | DeleteSysStrategy | RequiresToken | IStrategyService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/StrategyController.cs:232 |
| API-USER-GETUSERLIST | Employee | POST | /User/GetUserList | UserController | GetUserList | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:48 |
| API-USER-CHANGESYSDICISENABLE | Employee | POST | /User/ChangeSysDicIsEnable | UserController | ChangeSysDicIsEnable | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:92 |
| API-USER-ADDSYSUSER | Employee | POST | /User/AddSysUser | UserController | AddSysUser | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:131 |
| API-USER-GETUSER | Employee | POST | /User/GetUser | UserController | GetUser | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:182 |
| API-USER-GETUSERBYLOGIN | Employee | GET | /User/GetUserByLogin | UserController | GetUserByLogin | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:249 |
| API-USER-UPDATESYSUSER | Employee | POST | /User/UpdateSysUser | UserController | UpdateSysUser | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:276 |
| API-USER-GETALLROLE | Employee | POST | /User/GetAllRole | UserController | GetAllRole | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:353 |
| API-USER-DELETESYSUSER | Employee | POST | /User/DeleteSysUser | UserController | DeleteSysUser | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:382 |
| API-USER-INITSYSUSERPASSWORD | Employee | POST | /User/InitSysUserPassword | UserController | InitSysUserPassword | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:428 |
| API-USER-ADDUSERROLERELATIONSHIP | Employee | POST | /User/AddUserRoleRelationShip | UserController | AddUserRoleRelationShip | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:480 |
| API-USER-GETUSERPROFILE | Employee | GET | /User/GetUserProfile | UserController | GetUserProfile | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:519 |
| API-USER-UPDATEPASSWORD | Employee | GET | /User/UpdatePassword | UserController | UpdatePassword | RequiresToken | ISystemLogService<br>ITokenService<br>IUserService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Employee/UserController.cs:551 |
| API-CARCOLLECT-REPORT | Info | POST | /CarCollect/Report | CarCollectController | Report | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/CarCollectController.cs:27 |
| API-CARFAULT-REPORT | Info | POST | /CarFault/Report | CarFaultController | Report | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/CarFaultController.cs:38 |
| API-CARFAULT-GETLISTBYCAR | Info | GET | /CarFault/GetListByCar | CarFaultController | GetListByCar | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/CarFaultController.cs:73 |
| API-CARFAULT-GETRECENTLIST | Info | GET | /CarFault/GetRecentList | CarFaultController | GetRecentList | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/CarFaultController.cs:117 |
| API-CARFAULT-GETBYTASKRANGE | Info | GET | /CarFault/GetByTaskRange | CarFaultController | GetByTaskRange | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/CarFaultController.cs:209 |
| API-DICT-GETDICLIST | Info | POST | /Dict/GetDicList | DictController | GetDicList | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:34 |
| API-DICT-GETSYSDIC | Info | GET | /Dict/GetSysDic | DictController | GetSysDic | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:68 |
| API-DICT-CHANGESYSDICISENABLE | Info | POST | /Dict/ChangeSysDicIsEnable | DictController | ChangeSysDicIsEnable | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:92 |
| API-DICT-GETPAGEDICTLIST | Info | POST | /Dict/GetPageDictList | DictController | GetPageDictList | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:141 |
| API-DICT-ADDDICT | Info | POST | /Dict/AddDict | DictController | AddDict | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:189 |
| API-DICT-UPDATEDICT | Info | POST | /Dict/UpdateDict | DictController | UpdateDict | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:329 |
| API-DICT-DELETEDICT | Info | POST | /Dict/DeleteDict | DictController | DeleteDict | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:422 |
| API-DICT-GETDICCHILDBYDICTNAME | Info | POST | /Dict/GetDicChildByDictName | DictController | GetDicTreeByDictName | RequiresToken | IDictService<br>ISystemLogService<br>ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/DictController.cs:497 |
| API-EXSYSTEM-GETPAGEEXSYSTEMLIST | Info | POST | /ExSystem/GetPageExSystemList | ExSystemController | GetPageExSystemList | RequiresToken | IExSystemService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/ExSystemController.cs:42 |
| API-EXSYSTEM-ADDEXSYSTEM | Info | POST | /ExSystem/AddExSystem | ExSystemController | AddExSystem | RequiresToken | IExSystemService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/ExSystemController.cs:86 |
| API-EXSYSTEM-UPDATEEXSYSTEM | Info | POST | /ExSystem/UpdateExSystem | ExSystemController | UpdateExSystem | RequiresToken | IExSystemService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/ExSystemController.cs:143 |
| API-EXSYSTEM-DELETEEXSYSTEM | Info | POST | /ExSystem/DeleteExSystem | ExSystemController | DeleteExSystem | RequiresToken | IExSystemService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/ExSystemController.cs:200 |
| API-FAULTDESC-GETEXCLIST | Info | GET | /FaultDesc/GetExcList | FaultDescController | GetExcList | RequiresToken | IFaultDescService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/FaultDescController.cs:38 |
| API-FAULTDESC-GETPAGEFAULTLIST | Info | POST | /FaultDesc/GetPageFaultList | FaultDescController | GetPageFaultList | RequiresToken | IFaultDescService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Info/FaultDescController.cs:65 |
| API-LOGANALYSIS-PACKAGES | Log | GET | /LogAnalysis/Packages | LogAnalysisController | GetPackages | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:70 |
| API-LOGANALYSIS-PACKAGES-DOWNLOAD-DATE-FILENAME | Log | GET | /LogAnalysis/Packages/Download/{date}/{fileName} | LogAnalysisController | DownloadPackageAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:101 |
| API-LOGANALYSIS-PACKAGES-BATCH-DOWNLOAD | Log | POST | /LogAnalysis/Packages/Batch-Download | LogAnalysisController | DownloadPackagesBatchAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:128 |
| API-LOGANALYSIS-PACKAGES-MANUAL | Log | POST | /LogAnalysis/Packages/Manual | LogAnalysisController | CreateSchedulerPackage | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:172 |
| API-LOGANALYSIS-VEHICLE-PACKAGES | Log | GET | /LogAnalysis/Vehicle-Packages | LogAnalysisController | GetVehiclePackagesAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:184 |
| API-LOGANALYSIS-VEHICLE-PACKAGES-MANUAL | Log | POST | /LogAnalysis/Vehicle-Packages/Manual | LogAnalysisController | CreateVehiclePackageAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:211 |
| API-LOGANALYSIS-VEHICLE-PACKAGES-DOWNLOAD | Log | GET | /LogAnalysis/Vehicle-Packages/Download | LogAnalysisController | DownloadVehiclePackageAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:247 |
| API-LOGANALYSIS-VEHICLE-PACKAGES-BATCH-DOWNLOAD | Log | POST | /LogAnalysis/Vehicle-Packages/Batch-Download | LogAnalysisController | DownloadVehiclePackagesBatchAsync | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/LogAnalysisController.cs:294 |
| API-MSGSENDTHIRD-GETPAGEMSGSENDTHIRDLOGLIST | Log | POST | /MSGSendThird/GetPageMsgSendThirdLogList | MSGSendThirdController | GetPageMsgSendThirdLogList | RequiresToken | IMsgSendThirdService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/MSGSendThirdController.cs:31 |
| API-MSGSENDTHIRDLOG-ADDMSGSENDTHIRDLOG | Log | POST | /MsgSendThirdLog/AddMsgSendThirdLog | MSGSendThirdController | AddMsgSendThirdLog | RequiresToken | IMsgSendThirdService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/MSGSendThirdController.cs:72 |
| API-SYSTEMLOG-GETPAGESYSLOGLIST | Log | POST | /SystemLog/GetPageSysLogList | SystemLogController | GetPageSysLogList | RequiresToken | ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Log/SystemLogController.cs:31 |
| API-MAP-GETMAP | Map | GET | /Map/GetMap | MapController | GetMap | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:79 |
| API-MAP-GETPAGEMAPLIST | Map | POST | /Map/GetPageMapList | MapController | GetPageMapList | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:182 |
| API-MAP-GETPAGEMAPLISTALL | Map | POST | /Map/GetPageMapListAll | MapController | GetPageMapListAll | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:224 |
| API-MAP-UPDATEMAP | Map | POST | /Map/UpdateMap | MapController | UpdateMap | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:263 |
| API-MAP-DELETEMAP | Map | POST | /Map/DeleteMap | MapController | DeleteMap | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:315 |
| API-MAP-GETMAPBYMAPCODE | Map | GET | /Map/GetMapByMapCode | MapController | GetMapByMapCode | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:353 |
| API-MAP-ISCURRENTMAPOFFICIAL | Map | GET | /Map/IsCurrentMapOfficial | MapController | IsCurrentMapOfficial | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:390 |
| API-MAP-ADDMAP | Map | POST | /Map/AddMap | MapController | AddMap | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:426 |
| API-MAP-ADDMAPDATA | Map | POST | /Map/AddMapData | MapController | AddMapData | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:487 |
| API-MAP-PUBLISHMAPDATA | Map | POST | /Map/PublishMapData | MapController | PublishMapData | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:602 |
| API-MAP-SAVEMAPDATA | Map | POST | /Map/SaveMapData | MapController | SaveMapData | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:713 |
| API-MAP-GETMAPDATA | Map | POST | /Map/GetMapData | MapController | GetMapData | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:1103 |
| API-MAP-GETMAPLAYER | Map | GET | /Map/GetMapLayer | MapController | GetMapLayer | RequiresToken | IAreaService<br>ICarService<br>IMapService<br>ISiteService<br>ISystemLogService<br>ITextService<br>ITokenService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MapController.cs:1463 |
| API-MISSION-GETPAGEMISSIONLIST | Map | POST | /Mission/GetPageMissionList | MissionController | GetPageMissionList | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:48 |
| API-MISSION-GETMISSIONRUNNINGSTATUS | Map | GET | /Mission/GetMissionRunningStatus | MissionController | GetMissionRunningStatus | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:94 |
| API-MISSION-ADDMISSION | Map | POST | /Mission/AddMission | MissionController | AddMission | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:133 |
| API-MISSION-UPDATEMISSION | Map | POST | /Mission/UpdateMission | MissionController | UpdateMission | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:198 |
| API-MISSION-DELETEMISSION | Map | POST | /Mission/DeleteMission | MissionController | DeleteMission | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:264 |
| API-MISSION-GETPAGEMISSIONCLASSNAME | Map | GET | /Mission/GetPageMissionClassName | MissionController | GetPageMissionClassName | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:311 |
| API-MISSION-GETPAGEMISSIONCLASSANDNAME | Map | GET | /Mission/GetPageMissionClassAndName | MissionController | GetPageMissionClassAndName | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:345 |
| API-MISSION-GETMISSIONCONFIGSCHEMA | Map | GET | /Mission/GetMissionConfigSchema | MissionController | GetMissionConfigSchema | RequiresToken | IMissionService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/MissionController.cs:390 |
| API-PROPMETA-GETMETA | Map | GET | /PropMeta/GetMeta | PropMetaController | GetMeta | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/PropMetaController.cs:28 |
| API-PROPMETA-GETLAYERS | Map | GET | /PropMeta/GetLayers | PropMetaController | GetLayers | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/PropMetaController.cs:60 |
| API-PROPMETA-INVOKEACTION | Map | POST | /PropMeta/InvokeAction | PropMetaController | InvokeAction | RequiresToken |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/PropMetaController.cs:91 |
| API-SITE-GETPAGESITELIST | Map | POST | /Site/GetPageSiteList | SiteController | GetPageSiteList | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:45 |
| API-SITE-SITEISEXIST | Map | GET | /Site/SiteIsExist | SiteController | SiteIsExist | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:89 |
| API-SITE-ADDSITE | Map | POST | /Site/AddSite | SiteController | AddSite | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:126 |
| API-SITE-UPDATESITE | Map | POST | /Site/UpdateSite | SiteController | UpdateSite | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:183 |
| API-SITE-DELETESITE | Map | POST | /Site/DeleteSite | SiteController | DeleteSite | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:244 |
| API-SITE-GETSITEBYSITEID | Map | GET | /Site/GetSiteBySiteId | SiteController | GetSiteBySiteId | RequiresToken | ISiteService<br>ISystemLogService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/SiteController.cs:278 |
| API-TRACK-GETPAGETRACKLIST | Map | POST | /Track/GetPageTrackList | TrackController | GetPageTrackList | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:47 |
| API-TRACK-ADDTRACK | Map | POST | /Track/AddTrack | TrackController | AddTrack | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:91 |
| API-TRACK-UPDATETRACK | Map | POST | /Track/UpdateTrack | TrackController | UpdateTrack | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:148 |
| API-TRACK-DELETETRACK | Map | POST | /Track/DeleteTrack | TrackController | DeleteTrack | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:215 |
| API-TRACK-GETTRACKBYTRACKID | Map | GET | /Track/GetTrackByTrackId | TrackController | GetTrackByTrackId | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:249 |
| API-TRACK-QUICKCURVEOPTIMIZATION | Map | POST | /Track/QuickCurveOptimization | TrackController | QuickCurveOptimization | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:281 |
| API-TRACK-BESTCURVEOPTIMIZATIO | Map | POST | /Track/BestCurveOptimizatio | TrackController | BestCurveOptimizatio | RequiresToken | ISystemLogService<br>ITrackService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Map/TrackController.cs:294 |
| API-KANBAN-GETMAPDATA | Monitor | GET | /KanBan/GetMapData | KanBanController | GetMap | not observed | ICarImgService<br>ICarService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Monitor/KanBanController.cs:33 |
| API-KANBAN-GETCURRENTTASK | Monitor | GET | /KanBan/GetCurrentTask | KanBanController | GetCurrentTask | not observed | ICarImgService<br>ICarService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Monitor/KanBanController.cs:142 |
| API-KANBAN-GETTASKSTATISTICS | Monitor | GET | /KanBan/GetTaskStatistics | KanBanController | GetTaskStatistics | not observed | ICarImgService<br>ICarService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Monitor/KanBanController.cs:192 |
| API-KANBAN-GETALLCARSTATUE | Monitor | GET | /KanBan/GetAllCarStatue | KanBanController | GetAllCarStatue | not observed | ICarImgService<br>ICarService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Monitor/KanBanController.cs:251 |
| API-KANBAN-GETALLCHARGESTATUE | Monitor | GET | /KanBan/GetAllChargeStatue | KanBanController | GetAllChargeStatue | not observed | ICarImgService<br>ICarService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Monitor/KanBanController.cs:322 |
| API-STATISTICS-GETDASHBOARDSTATISTICS | Report | GET | /Statistics/GetDashboardStatistics | StatisticsController | GetDashboardStatistics | RequiresToken | IBatteryService<br>ICarCollectService<br>ICarFaultService<br>ICarService<br>IMapService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Report/StatisticsController.cs:61 |
| API-STATISTICS-GETEFFICSTATISTICS | Report | POST | /Statistics/GetEfficStatistics | StatisticsController | GetEfficStatistics | RequiresToken | IBatteryService<br>ICarCollectService<br>ICarFaultService<br>ICarService<br>IMapService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Report/StatisticsController.cs:156 |
| API-STATISTICS-GETCARELECONSUMESTATISTICS | Report | POST | /Statistics/GetCarEleConsumeStatistics | StatisticsController | GetCarEleConsumeStatistics | RequiresToken | IBatteryService<br>ICarCollectService<br>ICarFaultService<br>ICarService<br>IMapService<br>ITaskService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Report/StatisticsController.cs:250 |
| API-TASK-GETPAGETASKLIST | Task | POST | /Task/GetPageTaskList | TaskController | GetPageTaskList | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:49 |
| API-TASK-GETTASKBYTASKCODE | Task | GET | /Task/GetTaskByTaskCode | TaskController | GetTaskByTaskCode | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:125 |
| API-TASK-GETTASKDETAILBYTASKCODE | Task | GET | /Task/GetTaskDetailByTaskCode | TaskController | GetTaskDetailByTaskCode | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:160 |
| API-TASK-ADDTASK | Task | POST | /Task/AddTask | TaskController | AddTask | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:187 |
| API-TASK-RESENDTASK | Task | POST | /Task/ResendTask | TaskController | ResendTask | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:286 |
| API-TASK-UPDATETASKPRIORITY | Task | POST | /Task/UpdateTaskPriority | TaskController | UpdateTaskPriority | RequiresToken | ISystemLogService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskController.cs:347 |
| API-TASKMAINTANANC-GETPAGETASKMAINTANANCLIST | Task | POST | /TaskMaintananc/GetPageTaskMaintanancList | TaskMaintananController | GetPageTaskMaintanancList | RequiresToken | ISystemLogService<br>ITaskMaintananceService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskMaintananController.cs:47 |
| API-TASKMAINTANANC-WEEKLYTASKMAINTANANCCOUNT | Task | GET | /TaskMaintananc/WeeklyTaskMaintanancCount | TaskMaintananController | WeeklyTaskMaintanancCount | RequiresToken | ISystemLogService<br>ITaskMaintananceService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskMaintananController.cs:105 |
| API-TASKSCRIPT-GETTASKSCRIPTLIST | Task | GET | /TaskScript/GetTaskScriptList | TaskScriptController | GetTaskScriptList | RequiresToken | ITaskScriptService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/Task/TaskScriptController.cs:31 |
| API-TEST | Infrastructure | GET | /test | WebBaseController | test | RequiresToken | ITokenService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Areas/WebBaseController.cs:91 |
| API-ACTION-RESETALL | External/Controller | GET | /action/ResetAll | actionController | ResetAll | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/actionController.cs:21 |
| API-ACTION-RESETAGV | External/Controller | GET | /action/ResetAGV | actionController | ResetAGV | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/actionController.cs:188 |
| API-ACTION-RESETPOSITION | External/Controller | GET | /action/ResetPosition | actionController | ResetPosition | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/actionController.cs:334 |
| API-ACTION-REPAIR | External/Controller | GET | /action/Repair | actionController | Repair | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/actionController.cs:464 |
| API-ACTION-OFFLINE | External/Controller | GET | /action/Offline | actionController | Offline | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/actionController.cs:521 |
| API-APP-VERSION | External/Controller | GET | /app/version | appVersionController | GetLatestVersion | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/appVersionController.cs:23 |
| API-APP-DOWNLOAD | External/Controller | GET | /app/download | appVersionController | DownloadAppAsync | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/appVersionController.cs:84 |
| API-CTRL-SOFTSTOP | External/Controller | GET | /ctrl/SoftStop | ctrlController | SoftStop | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:17 |
| API-CTRL-SOFTSTART | External/Controller | GET | /ctrl/SoftStart | ctrlController | SoftStart | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:54 |
| API-CTRL-SOFTSTOPONLY | External/Controller | GET | /ctrl/SoftStopOnly | ctrlController | SoftStopOnly | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:92 |
| API-CTRL-SOFTSTARTONLY | External/Controller | GET | /ctrl/SoftStartOnly | ctrlController | SoftStartOnly | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:148 |
| API-CTRL-REFRESHMAP | External/Controller | GET | /ctrl/RefreshMap | ctrlController | RefreshMap | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:205 |
| API-CTRL-GOTOSTANDBY | External/Controller | GET | /ctrl/GotoStandby | ctrlController | GotoStandby | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:251 |
| API-CTRL-GOTOCHARGE | External/Controller | GET | /ctrl/GotoCharge | ctrlController | GotoRecharger | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/ctrlController.cs:303 |
| API-INFO-GETALLCAR | External/Controller | GET | /info/GetAllCar | infoController | GetAllCar | not observed | ICarImgService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/infoController.cs:27 |
| API-INFO-GETALLCARIMG | External/Controller | GET | /info/GetAllCarImg | infoController | GetAllCarImg | not observed | ICarImgService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/infoController.cs:68 |
| API-INFO-GETCARINFO | External/Controller | GET | /info/GetCarInfo | infoController | GetCarInfo | not observed | ICarImgService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/infoController.cs:105 |
| API-INFO-GETMAP | External/Controller | GET | /info/GetMap | infoController | GetMap | not observed | ICarImgService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/infoController.cs:164 |
| API-INFO-DOWNLOAD-DIRECTORY-FILE | External/Controller | GET | /info/download/{directory}/{file} | infoController | DownloadFileAsync | not observed | ICarImgService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/infoController.cs:239 |
| API-TASK-PUSHTASK | External/Controller | POST | /task/PushTask | taskController | PushTask | not observed | ITaskCancelService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/taskController.cs:49 |
| API-TASK-PUSHTASKCANCEL | External/Controller | POST | /task/PushTaskCancel | taskController | PushTaskCancel | not observed | ITaskCancelService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/taskController.cs:213 |
| API-TASK-PUSHCHARGEPRIORITY | External/Controller | POST | /task/PushChargePriority | taskController | PushChargePriority | not observed | ITaskCancelService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/taskController.cs:369 |
| API-TASK-GETTASK | External/Controller | GET | /task/GetTask | taskController | GetTask | not observed | ITaskCancelService<br>ITaskService<br>ITmpService | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Controller/taskController.cs:419 |
| API-GETNEWPOS | Infrastructure | GET | /getNewPos | WebAPIAgvInterface | getNewPos | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIAgvInterface.cs:20 |
| API-RESTART | Infrastructure | GET | /restart | WebAPIContainer | restart | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:60 |
| API-GETINSTANCEID | Infrastructure | GET | /getInstanceID | WebAPIContainer | getInstanceID | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:73 |
| API-DUMP | Infrastructure | GET | /dump | WebAPIContainer | dump | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:81 |
| API-TIME-SYNC | Infrastructure | GET | /time-sync | WebAPIContainer | timeSync | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:97 |
| API-TIME-SYNC-V2 | Infrastructure | POST | /time-sync/v2 | WebAPIContainer | timeSyncV2 | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:109 |
| API-TRYLOCK | Infrastructure | POST | /trylock | WebAPIContainer | trylock | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:141 |
| API-LEAVE | Infrastructure | GET | /leave | WebAPIContainer | leave | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:178 |
| API-GETCARLIST | Infrastructure | GET | /getCarList | WebAPIContainer | getCarList | not observed |  | UNKNOWN unless method/body code confirms | HZ.RSSComposer/Interfaces/WebAPIContainer.cs:213 |

## Frontend API Inventory

| API ID | Function | Method | URL | Source | Confidence |
| --- | --- | --- | --- | --- | --- |
| FE-LOGIN-SRC-API-AUTH-INDEX-TS-ACCOUNT-LOGIN | login | POST | /Account/Login | src/api/auth/index.ts:15 | CONFIRMED_FROM_CODE |
| FE-GETINFO-SRC-API-AUTH-INDEX-TS-ACCOUNT-INFO | getInfo | GET | /Account/Info | src/api/auth/index.ts:27 | CONFIRMED_FROM_CODE |
| FE-REFRESHTOKEN-SRC-API-AUTH-INDEX-TS-ACCOUNT-REFRESH-TOKEN | refreshToken | POST | /Account/refresh-token | src/api/auth/index.ts:34 | CONFIRMED_FROM_CODE |
| FE-LOGOUT-SRC-API-AUTH-INDEX-TS-ACCOUNT-LOGOUT | logout | POST | /Account/Logout | src/api/auth/index.ts:46 | CONFIRMED_FROM_CODE |
| FE-GETTABLEPAGE-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLE-PAGE | getTablePage | GET | /api/v1/codegen/table/page | src/api/codegen/index.ts:9 | CONFIRMED_FROM_CODE |
| FE-GETGENCONFIG-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLENAME-CONFIG | getGenConfig | GET | /api/v1/codegen/${tableName}/config | src/api/codegen/index.ts:18 | CONFIRMED_FROM_CODE |
| FE-SAVEGENCONFIG-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLENAME-CONFIG | saveGenConfig | POST | /api/v1/codegen/${tableName}/config | src/api/codegen/index.ts:26 | CONFIRMED_FROM_CODE |
| FE-GETPREVIEWDATA-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLENAME-PREVIEW | getPreviewData | GET | /api/v1/codegen/${tableName}/preview | src/api/codegen/index.ts:35 | CONFIRMED_FROM_CODE |
| FE-RESETGENCONFIG-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLENAME-CONFIG | resetGenConfig | DELETE | /api/v1/codegen/${tableName}/config | src/api/codegen/index.ts:43 | CONFIRMED_FROM_CODE |
| FE-DOWNLOAD-SRC-API-CODEGEN-INDEX-TS-API-V1-CODEGEN-TABLENAME-DOWNLOAD | download | GET | /api/v1/codegen/${tableName}/download | src/api/codegen/index.ts:55 | CONFIRMED_FROM_CODE |
| FE-TREESELECT-SRC-API-EMPLOYEE-MENU-TS-MENU-GETMENUTREE | treeselect | GET | /Menu/GetMenuTree | src/api/employee/menu.ts:6 | CONFIRMED_FROM_CODE |
| FE-ROLEMENUTREESELECT-SRC-API-EMPLOYEE-MENU-TS-MENU-ROLEMENUTREESELECT | roleMenuTreeselect | GET | /Menu/roleMenuTreeselect | src/api/employee/menu.ts:13 | CONFIRMED_FROM_CODE |
| FE-ADDMENU-SRC-API-EMPLOYEE-MENU-TS-MENU-SAVEMENU | addMenu | POST | /Menu/SaveMenu | src/api/employee/menu.ts:21 | CONFIRMED_FROM_CODE |
| FE-UPDATEMENU-SRC-API-EMPLOYEE-MENU-TS-MENU-SAVEMENU | updateMenu | POST | /Menu/SaveMenu | src/api/employee/menu.ts:28 | CONFIRMED_FROM_CODE |
| FE-SAVEMENU-SRC-API-EMPLOYEE-MENU-TS-MENU-SAVEMENU | saveMenu | POST | /Menu/SaveMenu | src/api/employee/menu.ts:35 | CONFIRMED_FROM_CODE |
| FE-DELETEMENU-SRC-API-EMPLOYEE-MENU-TS-MENU-DELETEMENU | DeleteMenu | GET | /Menu/DeleteMenu | src/api/employee/menu.ts:43 | CONFIRMED_FROM_CODE |
| FE-GETMENUBYID-SRC-API-EMPLOYEE-MENU-TS-MENU-GETMENUBYID | getMenuById | GET | /Menu/GetMenuById | src/api/employee/menu.ts:51 | CONFIRMED_FROM_CODE |
| FE-GETBUTTONS-SRC-API-EMPLOYEE-MENU-TS-MENU-GETBUTTONS | getButtons | GET | /Menu/GetButtons | src/api/employee/menu.ts:58 | CONFIRMED_FROM_CODE |
| FE-GETMENUBUTTONS-SRC-API-EMPLOYEE-MENU-TS-MENU-GETMENUBUTTONS | getMenuButtons | GET | /Menu/GetMenuButtons | src/api/employee/menu.ts:64 | CONFIRMED_FROM_CODE |
| FE-SAVEMENUBUTTON-SRC-API-EMPLOYEE-MENU-TS-MENU-SAVEMENUBUTTON | saveMenuButton | POST | /Menu/SaveMenuButton | src/api/employee/menu.ts:71 | CONFIRMED_FROM_CODE |
| FE-GETBUTTONPOWERBYCNAME-SRC-API-EMPLOYEE-MENU-TS-POWER-GETMENUBUTTONPOWER | getButtonPowerByCName | GET | /power/GetMenuButtonPower | src/api/employee/menu.ts:78 | CONFIRMED_FROM_CODE |
| FE-GETROLEPAGE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETROLEPAGE | GetRolePage | POST | /Role/GetRolePage | src/api/employee/role.ts:6 | CONFIRMED_FROM_CODE |
| FE-SAVEROLE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-SAVEROLE | SaveRole | POST | /Role/SaveRole | src/api/employee/role.ts:15 | CONFIRMED_FROM_CODE |
| FE-GETRULEUSER-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETRULEUSER | GetRuleUser | GET | /Role/GetRuleUser | src/api/employee/role.ts:24 | CONFIRMED_FROM_CODE |
| FE-GETUSERROLE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETUSERROLE | GetUserRole | GET | /Role/GetUserRole | src/api/employee/role.ts:31 | CONFIRMED_FROM_CODE |
| FE-GETROLE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETROLE | GetRole | GET | /Role/GetRole | src/api/employee/role.ts:38 | CONFIRMED_FROM_CODE |
| FE-GETROLELIST-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETROLELIST | GetRoleList | POST | /Role/GetRoleList | src/api/employee/role.ts:45 | CONFIRMED_FROM_CODE |
| FE-GETALLUSER-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETALLUSER | GetAllUser | POST | /Role/GetAllUser | src/api/employee/role.ts:52 | CONFIRMED_FROM_CODE |
| FE-GETUSERBYROLE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETUSERBYROLE | GetUserByRole | GET | /Role/GetUserByRole | src/api/employee/role.ts:59 | CONFIRMED_FROM_CODE |
| FE-SAVEROLEUSER-SRC-API-EMPLOYEE-ROLE-TS-ROLE-SAVEROLEUSER | SaveRoleUser | POST | /Role/SaveRoleUser | src/api/employee/role.ts:66 | CONFIRMED_FROM_CODE |
| FE-DELETEROLE-SRC-API-EMPLOYEE-ROLE-TS-ROLE-DELETEROLE | DeleteRole | GET | /Role/DeleteRole | src/api/employee/role.ts:73 | CONFIRMED_FROM_CODE |
| FE-GETROLEPERMISSIONSDATA-SRC-API-EMPLOYEE-ROLE-TS-ROLE-GETROLEPERMISSIONSDATA | GetRolePermissionsData | POST | /Role/GetRolePermissionsData | src/api/employee/role.ts:80 | CONFIRMED_FROM_CODE |
| FE-SAVEROLEPERMISSIONS-SRC-API-EMPLOYEE-ROLE-TS-ROLE-SAVEROLEPERMISSIONS | SaveRolePermissions | POST | /Role/SaveRolePermissions | src/api/employee/role.ts:87 | CONFIRMED_FROM_CODE |
| FE-GETUSERPAGE-SRC-API-EMPLOYEE-USER-TS-USER-GETUSERLIST | getUserPage | POST | /User/GetUserList | src/api/employee/user.ts:6 | CONFIRMED_FROM_CODE |
| FE-ADDUSER-SRC-API-EMPLOYEE-USER-TS-USER-ADDSYSUSER | addUser | POST | /User/AddSysUser | src/api/employee/user.ts:15 | CONFIRMED_FROM_CODE |
| FE-UPDATEUSER-SRC-API-EMPLOYEE-USER-TS-USER-UPDATESYSUSER | updateUser | POST | /User/UpdateSysUser | src/api/employee/user.ts:23 | CONFIRMED_FROM_CODE |
| FE-GETUSERBYID-SRC-API-EMPLOYEE-USER-TS-USER-GETUSER | GetUserByID | POST | /User/GetUser | src/api/employee/user.ts:31 | CONFIRMED_FROM_CODE |
| FE-DELUSER-SRC-API-EMPLOYEE-USER-TS-USER-DELETESYSUSER | delUser | POST | /User/DeleteSysUser/ | src/api/employee/user.ts:39 | CONFIRMED_FROM_CODE |
| FE-INITSYSUSERPASSWORD-SRC-API-EMPLOYEE-USER-TS-USER-INITSYSUSERPASSWORD | InitSysUserPassword | POST | /User/InitSysUserPassword | src/api/employee/user.ts:47 | CONFIRMED_FROM_CODE |
| FE-CHANGEUSERSTATUS-SRC-API-EMPLOYEE-USER-TS-USER-CHANGESYSDICISENABLE | changeUserStatus | POST | /User/ChangeSysDicIsEnable | src/api/employee/user.ts:55 | CONFIRMED_FROM_CODE |
| FE-GETUSERROLE-SRC-API-EMPLOYEE-USER-TS-ROLE-GETUSERROLE | GetUserRole | GET | /Role/GetUserRole | src/api/employee/user.ts:63 | CONFIRMED_FROM_CODE |
| FE-GETALLROLE-SRC-API-EMPLOYEE-USER-TS-USER-GETALLROLE | getAllRole | POST | /User/GetAllRole | src/api/employee/user.ts:71 | CONFIRMED_FROM_CODE |
| FE-GETUSERPROFILE-SRC-API-EMPLOYEE-USER-TS-USER-PROFILE | getUserProfile | GET | /User/profile | src/api/employee/user.ts:79 | CONFIRMED_FROM_CODE |
| FE-ADDUSERROLERELATIONSHIP-SRC-API-EMPLOYEE-USER-TS-USER-ADDUSERROLERELATIONSHIP | AddUserRoleRelationShip | POST | /User/AddUserRoleRelationShip | src/api/employee/user.ts:86 | CONFIRMED_FROM_CODE |
| FE-GETUSERBYLOGIN-SRC-API-EMPLOYEE-USER-TS-USER-GETUSERBYLOGIN | GetUserByLogin | GET | /User/GetUserByLogin | src/api/employee/user.ts:94 | CONFIRMED_FROM_CODE |
| FE-GETUSERPROFILE-SRC-API-EMPLOYEE-USER-TS-USER-GETUSERPROFILE | GetUserProfile | GET | /User/GetUserProfile | src/api/employee/user.ts:102 | CONFIRMED_FROM_CODE |
| FE-UPDATEPASSWORD-SRC-API-EMPLOYEE-USER-TS-USER-UPDATEPASSWORD | UpdatePassword | GET | /User/UpdatePassword | src/api/employee/user.ts:109 | CONFIRMED_FROM_CODE |
| FE-UPLOAD-SRC-API-FILE-INDEX-TS-API-V1-FILES | upload | POST | /api/v1/files | src/api/file/index.ts:11 | CONFIRMED_FROM_CODE |
| FE-UPLOADFILE-SRC-API-FILE-INDEX-TS-API-V1-FILES | uploadFile | POST | /api/v1/files | src/api/file/index.ts:27 | CONFIRMED_FROM_CODE |
| FE-DELETE-SRC-API-FILE-INDEX-TS-API-V1-FILES | delete | DELETE | /api/v1/files | src/api/file/index.ts:43 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMSGSENDLOGLIST-SRC-API-LOG-LOG-TS-MSGSENDLOG-GETPAGEMSGSENDLOGLIST | GetPageMsgSendLogList | POST | /MsgSendLog/GetPageMsgSendLogList | src/api/log/log.ts:5 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMSGSENDTHIRDLOGLIST-SRC-API-LOG-LOG-TS-MSGSENDTHIRD-GETPAGEMSGSENDTHIRDLOGLIST | GetPageMsgSendThirdLogList | POST | /MSGSendThird/GetPageMsgSendThirdLogList | src/api/log/log.ts:19 | CONFIRMED_FROM_CODE |
| FE-GETPAGESYSLOGLIST-SRC-API-LOG-LOG-TS-SYSTEMLOG-GETPAGESYSLOGLIST | GetPageSysLogList | POST | /SystemLog/GetPageSysLogList | src/api/log/log.ts:33 | CONFIRMED_FROM_CODE |
| FE-GETEXCLIST-SRC-API-LOG-LOG-TS-FAULTDESC-GETEXCLIST | GetExcList | GET | /FaultDesc/GetExcList | src/api/log/log.ts:40 | CONFIRMED_FROM_CODE |
| FE-GETRECENTFAULTLIST-SRC-API-LOG-LOG-TS-CARFAULT-GETRECENTLIST | GetRecentFaultList | GET | /CarFault/GetRecentList | src/api/log/log.ts:49 | CONFIRMED_FROM_CODE |
| FE-GETPAGEFAULTLIST-SRC-API-LOG-LOG-TS-FAULTDESC-GETPAGEFAULTLIST | GetPageFaultList | POST | /FaultDesc/GetPageFaultList | src/api/log/log.ts:56 | CONFIRMED_FROM_CODE |
| FE-GETSCHEDULERLOGPACKAGES-SRC-API-LOG-LOG-TS-LOGANALYSIS-PACKAGES | GetSchedulerLogPackages | GET | /LogAnalysis/Packages | src/api/log/log.ts:63 | CONFIRMED_FROM_CODE |
| FE-GETVEHICLELOGPACKAGES-SRC-API-LOG-LOG-TS-LOGANALYSIS-VEHICLE-PACKAGES | GetVehicleLogPackages | GET | /LogAnalysis/Vehicle-Packages | src/api/log/log.ts:71 | CONFIRMED_FROM_CODE |
| FE-CREATESCHEDULERLOGPACKAGE-SRC-API-LOG-LOG-TS-LOGANALYSIS-PACKAGES-MANUAL | CreateSchedulerLogPackage | POST | /LogAnalysis/Packages/Manual | src/api/log/log.ts:79 | CONFIRMED_FROM_CODE |
| FE-CREATESCHEDULERLOGPACKAGE-SRC-API-LOG-LOG-TS-LOGANALYSIS-VEHICLE-PACKAGES-MANUAL | CreateSchedulerLogPackage | POST | /LogAnalysis/Vehicle-Packages/Manual | src/api/log/log.ts:85 | CONFIRMED_FROM_CODE |
| FE-DOWNLOADVEHICLELOGPACKAGE-SRC-API-LOG-LOG-TS-LOGANALYSIS-VEHICLE-PACKAGES-DOWNLOAD | DownloadVehicleLogPackage | GET | /LogAnalysis/Vehicle-Packages/Download | src/api/log/log.ts:100 | CONFIRMED_FROM_CODE |
| FE-DOWNLOADSCHEDULERLOGPACKAGES-SRC-API-LOG-LOG-TS-LOGANALYSIS-PACKAGES-BATCH-DOWNLOAD | DownloadSchedulerLogPackages | POST | /LogAnalysis/Packages/Batch-Download | src/api/log/log.ts:109 | CONFIRMED_FROM_CODE |
| FE-DOWNLOADVEHICLELOGPACKAGES-SRC-API-LOG-LOG-TS-LOGANALYSIS-VEHICLE-PACKAGES-BATCH-DOWNLOAD | DownloadVehicleLogPackages | POST | /LogAnalysis/Vehicle-Packages/Batch-Download | src/api/log/log.ts:118 | CONFIRMED_FROM_CODE |
| FE-GETMAPFILELIST-SRC-API-MAP-MAP-TS-INFO-GETMAPFILELIST | GetMapFileList | GET | /info/GetMapFileList | src/api/map/map.ts:7 | CONFIRMED_FROM_CODE |
| FE-GETMAPFILE-SRC-API-MAP-MAP-TS-INFO-GETMAPFILE | GetMapFile | GET | /info/GetMapFile | src/api/map/map.ts:15 | CONFIRMED_FROM_CODE |
| FE-GETMAP-SRC-API-MAP-MAP-TS-MAP-GETMAP | GetMap | GET | /Map/GetMap | src/api/map/map.ts:24 | CONFIRMED_FROM_CODE |
| FE-GETALLCARPOS-SRC-API-MAP-MAP-TS-INFO-GETALLCAR | GetAllCarPos | GET | /info/GetAllCar | src/api/map/map.ts:30 | CONFIRMED_FROM_CODE |
| FE-GETALLCARIMG-SRC-API-MAP-MAP-TS-INFO-GETALLCARIMG | GetAllCarImg | GET | /info/GetAllCarImg | src/api/map/map.ts:39 | CONFIRMED_FROM_CODE |
| FE-ADDMAPDATA-SRC-API-MAP-MAP-TS-MAP-ADDMAPDATA | AddMapData | POST | /Map/AddMapData | src/api/map/map.ts:48 | CONFIRMED_FROM_CODE |
| FE-GETDXFMAPFILE-SRC-API-MAP-MAP-TS-INFO-GETDXFMAPFILE | GetDxfMapFile | GET | /info/GetDxfMapFile | src/api/map/map.ts:55 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMAPLIST-SRC-API-MAP-MAP-TS-MAP-GETPAGEMAPLIST | GetPageMapList | POST | /Map/GetPageMapList | src/api/map/map.ts:61 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMAPLISTALL-SRC-API-MAP-MAP-TS-MAP-GETPAGEMAPLISTALL | GetPageMapListAll | POST | /Map/GetPageMapListAll | src/api/map/map.ts:68 | CONFIRMED_FROM_CODE |
| FE-GETMAPBYMAPCODE-SRC-API-MAP-MAP-TS-MAP-GETMAPBYMAPCODE | GetMapByMapCode | GET | /Map/GetMapByMapCode | src/api/map/map.ts:75 | CONFIRMED_FROM_CODE |
| FE-GETMAPDATA-SRC-API-MAP-MAP-TS-MAP-GETMAPDATA | GetMapData | POST | /Map/GetMapData | src/api/map/map.ts:84 | CONFIRMED_FROM_CODE |
| FE-ISCURRENTMAPOFFICIAL-SRC-API-MAP-MAP-TS-MAP-ISCURRENTMAPOFFICIAL | IsCurrentMapOfficial | GET | /Map/IsCurrentMapOfficial | src/api/map/map.ts:91 | CONFIRMED_FROM_CODE |
| FE-GETMAPLAYER-SRC-API-MAP-MAP-TS-MAP-GETMAPLAYER | GetMapLayer | GET | /Map/GetMapLayer | src/api/map/map.ts:97 | CONFIRMED_FROM_CODE |
| FE-PUBLISHMAPDATA-SRC-API-MAP-MAP-TS-MAP-PUBLISHMAPDATA | PublishMapData | POST | /Map/PublishMapData | src/api/map/map.ts:103 | CONFIRMED_FROM_CODE |
| FE-QUICKCURVEOPTIMIZATION-SRC-API-MAP-MAP-TS-TRACK-QUICKCURVEOPTIMIZATION | QuickCurveOptimization | POST | /Track/QuickCurveOptimization | src/api/map/map.ts:110 | CONFIRMED_FROM_CODE |
| FE-BESTCURVEOPTIMIZATIO-SRC-API-MAP-MAP-TS-TRACK-BESTCURVEOPTIMIZATIO | BestCurveOptimizatio | POST | /Track/BestCurveOptimizatio | src/api/map/map.ts:117 | CONFIRMED_FROM_CODE |
| FE-UPDATEPATH-SRC-API-MAP-MAP-TS-MAP-UPDATEPATH | UpdatePath | POST | /Map/UpdatePath | src/api/map/map.ts:124 | CONFIRMED_FROM_CODE |
| FE-UPDATESITE-SRC-API-MAP-MAP-TS-MAP-UPDATESITE | UpdateSite | POST | /map/UpdateSite | src/api/map/map.ts:131 | CONFIRMED_FROM_CODE |
| FE-GETPATHBYSITEID-SRC-API-MAP-MAP-TS-MAP-GETPATHBYSITEID | GetPathBySiteId | GET | /Map/GetPathBySiteId | src/api/map/map.ts:138 | CONFIRMED_FROM_CODE |
| FE-GETPATHBYTRACKID-SRC-API-MAP-MAP-TS-MAP-GETPATHBYTRACKID | GetPathByTrackId | GET | /map/GetPathByTrackId | src/api/map/map.ts:145 | CONFIRMED_FROM_CODE |
| FE-SITEISEXIST-SRC-API-MAP-MAP-TS-MAP-SITEISEXIST | SiteIsExist | GET | /Map/SiteIsExist | src/api/map/map.ts:152 | CONFIRMED_FROM_CODE |
| FE-GETDASHBOARDSTATISTICS-SRC-API-REPORT-STATISTICS-TS-STATISTICS-GETDASHBOARDSTATISTICS | GetDashboardStatistics | GET | /Statistics/GetDashboardStatistics | src/api/report/statistics.ts:14 | CONFIRMED_FROM_CODE |
| FE-GETEFFICSTATISTICS-SRC-API-REPORT-STATISTICS-TS-STATISTICS-GETEFFICSTATISTICS | GetEfficStatistics | POST | /Statistics/GetEfficStatistics | src/api/report/statistics.ts:21 | CONFIRMED_FROM_CODE |
| FE-GETCARELECONSUMESTATISTICS-SRC-API-REPORT-STATISTICS-TS-STATISTICS-GETCARELECONSUMESTATISTICS | GetCarEleConsumeStatistics | POST | /Statistics/GetCarEleConsumeStatistics | src/api/report/statistics.ts:28 | CONFIRMED_FROM_CODE |
| FE-GETDICLIST-SRC-API-SYS-DICT-TS-DICT-GETDICLIST | GetDicList | POST | /Dict/GetDicList | src/api/sys/dict.ts:5 | CONFIRMED_FROM_CODE |
| FE-GETSYSDIC-SRC-API-SYS-DICT-TS-DICT-GETSYSDIC | GetSysDic | GET | /Dict/GetSysDic | src/api/sys/dict.ts:12 | CONFIRMED_FROM_CODE |
| FE-CHANGESYSDICISENABLE-SRC-API-SYS-DICT-TS-DICT-CHANGESYSDICISENABLE | ChangeSysDicIsEnable | POST | /Dict/ChangeSysDicIsEnable | src/api/sys/dict.ts:19 | CONFIRMED_FROM_CODE |
| FE-GETPAGEDICTLIST-SRC-API-SYS-DICT-TS-DICT-GETPAGEDICTLIST | GetPageDictList | POST | /Dict/GetPageDictList | src/api/sys/dict.ts:27 | CONFIRMED_FROM_CODE |
| FE-ADDDICT-SRC-API-SYS-DICT-TS-DICT-ADDDICT | AddDict | POST | /Dict/AddDict | src/api/sys/dict.ts:34 | CONFIRMED_FROM_CODE |
| FE-UPDATEDICT-SRC-API-SYS-DICT-TS-DICT-UPDATEDICT | UpdateDict | POST | /Dict/UpdateDict | src/api/sys/dict.ts:41 | CONFIRMED_FROM_CODE |
| FE-DELETEDICT-SRC-API-SYS-DICT-TS-DICT-DELETEDICT | DeleteDict | POST | /Dict/DeleteDict | src/api/sys/dict.ts:48 | CONFIRMED_FROM_CODE |
| FE-GETDICCHILDBYDICTNAME-SRC-API-SYS-DICT-TS-DICT-GETDICCHILDBYDICTNAME | GetDicChildByDictName | POST | /Dict/GetDicChildByDictName | src/api/sys/dict.ts:56 | CONFIRMED_FROM_CODE |
| FE-GETPAGEEXSYSTEMLIST-SRC-API-SYS-EXSYSTEM-TS-EXSYSTEM-GETPAGEEXSYSTEMLIST | GetPageExSystemList | POST | /ExSystem/GetPageExSystemList | src/api/sys/exsystem.ts:5 | CONFIRMED_FROM_CODE |
| FE-ADDEXSYSTEM-SRC-API-SYS-EXSYSTEM-TS-EXSYSTEM-ADDEXSYSTEM | AddExSystem | POST | /ExSystem/AddExSystem | src/api/sys/exsystem.ts:12 | CONFIRMED_FROM_CODE |
| FE-UPDATEEXSYSTEM-SRC-API-SYS-EXSYSTEM-TS-EXSYSTEM-UPDATEEXSYSTEM | UpdateExSystem | POST | /ExSystem/UpdateExSystem | src/api/sys/exsystem.ts:19 | CONFIRMED_FROM_CODE |
| FE-DELETEEXSYSTEM-SRC-API-SYS-EXSYSTEM-TS-EXSYSTEM-DELETEEXSYSTEM | DeleteExSystem | POST | /ExSystem/DeleteExSystem | src/api/sys/exsystem.ts:26 | CONFIRMED_FROM_CODE |
| FE-GETPAGEVEHICLELIST-SRC-API-SYS-VEHICLE-TS-CAR-GETPAGECARLIST | GetPageVehicleList | POST | /Car/GetPageCarList | src/api/sys/vehicle.ts:6 | CONFIRMED_FROM_CODE |
| FE-ADDVEHICLE-SRC-API-SYS-VEHICLE-TS-CAR-ADDCAR | AddVehicle | POST | /Car/AddCar | src/api/sys/vehicle.ts:15 | CONFIRMED_FROM_CODE |
| FE-UPDATEVEHICLE-SRC-API-SYS-VEHICLE-TS-CAR-UPDATECAR | UpdateVehicle | POST | /Car/UpdateCar | src/api/sys/vehicle.ts:23 | CONFIRMED_FROM_CODE |
| FE-DELETEVEHICLE-SRC-API-SYS-VEHICLE-TS-CAR-DELETECAR | DeleteVehicle | POST | /Car/DeleteCar | src/api/sys/vehicle.ts:31 | CONFIRMED_FROM_CODE |
| FE-GETALLCAR-SRC-API-SYS-VEHICLE-TS-CAR-GETALLCARDATA | GetAllCar | GET | /Car/GetAllCarData | src/api/sys/vehicle.ts:39 | CONFIRMED_FROM_CODE |
| FE-UPDATEALLVEHICLESTATE-SRC-API-SYS-VEHICLE-TS-CAR-UPDATEALLCARSTATE | UpdateAllVehicleState | GET | /Car/UpdateAllCarState | src/api/sys/vehicle.ts:46 | CONFIRMED_FROM_CODE |
| FE-GETALLCARLIST-SRC-API-SYS-VEHICLE-TS-CAR-GETALLCARLIST | GetAllCarList | GET | /Car/GetAllCarList | src/api/sys/vehicle.ts:53 | CONFIRMED_FROM_CODE |
| FE-RESETAGV-SRC-API-SYS-VEHICLE-TS-ACTION-RESETAGV | ResetAGV | GET | /action/ResetAGV | src/api/sys/vehicle.ts:61 | CONFIRMED_FROM_CODE |
| FE-GETVEHICLEDETAILBYAGVID-SRC-API-SYS-VEHICLE-TS-CAR-GETCARDETAILBYAGVID | GetVehicleDetailByAgvId | GET | /Car/GetCarDetailByAgvId | src/api/sys/vehicle.ts:72 | CONFIRMED_FROM_CODE |
| FE-RESETPOSITION-SRC-API-SYS-VEHICLE-TS-ACTION-RESETPOSITION | ResetPosition | GET | /action/ResetPosition | src/api/sys/vehicle.ts:80 | CONFIRMED_FROM_CODE |
| FE-GETCARINFO-SRC-API-SYS-VEHICLE-TS-INFO-GETCARINFO | GetCarInfo | GET | /info/GetCarInfo | src/api/sys/vehicle.ts:90 | CONFIRMED_FROM_CODE |
| FE-SOFTSTOPONLY-SRC-API-SYS-VEHICLE-TS-CTRL-SOFTSTOPONLY | SoftStopOnly | GET | /ctrl/SoftStopOnly | src/api/sys/vehicle.ts:98 | CONFIRMED_FROM_CODE |
| FE-SOFTSTARTONLY-SRC-API-SYS-VEHICLE-TS-CTRL-SOFTSTARTONLY | SoftStartOnly | GET | /ctrl/SoftStartOnly | src/api/sys/vehicle.ts:109 | CONFIRMED_FROM_CODE |
| FE-REPAIR-SRC-API-SYS-VEHICLE-TS-ACTION-OFFLINE | Repair | GET | /action/Offline | src/api/sys/vehicle.ts:120 | CONFIRMED_FROM_CODE |
| FE-GOTORECHARGER-SRC-API-SYS-VEHICLE-TS-CTRL-GOTOCHARGE | GotoRecharger | GET | /ctrl/GotoCharge | src/api/sys/vehicle.ts:132 | CONFIRMED_FROM_CODE |
| FE-GOTOSTANDBY-SRC-API-SYS-VEHICLE-TS-CTRL-GOTOSTANDBY | GotoStandby | GET | /ctrl/GotoStandby | src/api/sys/vehicle.ts:144 | CONFIRMED_FROM_CODE |
| FE-GETALLVEHICLEDATA-SRC-API-SYS-VEHICLE-TS-CAR-GETALLCARDATA | GetAllVehicleData | GET | /Car/GetAllCarData | src/api/sys/vehicle.ts:154 | CONFIRMED_FROM_CODE |
| FE-REFRESHMAP-SRC-API-SYS-VEHICLE-TS-CTRL-REFRESHMAP | RefreshMap | GET | /ctrl/RefreshMap | src/api/sys/vehicle.ts:161 | CONFIRMED_FROM_CODE |
| FE-GETPAGEVEHICLECLASSNAME-SRC-API-SYS-VEHICLE-TS-CAR-GETPAGECARCLASSNAME | GetPageVehicleClassName | GET | /Car/GetPageCarClassName | src/api/sys/vehicle.ts:170 | CONFIRMED_FROM_CODE |
| FE-GETCARCLASS-SRC-API-SYS-VEHICLE-TS-CAR-GETCARCLASS | GetCarClass | GET | /Car/GetCarClass | src/api/sys/vehicle.ts:176 | CONFIRMED_FROM_CODE |
| FE-GETCARSUBCLASS-SRC-API-SYS-VEHICLE-TS-CAR-GETCARSUBCLASS | GetCarSubClass | GET | /Car/GetCarSubClass | src/api/sys/vehicle.ts:182 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG-PAGE | getPage | GET | /api/v1/config/page | src/api/system/config.ts:9 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG-ID-FORM | getFormData | GET | /api/v1/config/${id}/form | src/api/system/config.ts:22 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG | add | POST | /api/v1/config | src/api/system/config.ts:30 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG-ID | update | PUT | /api/v1/config/${id} | src/api/system/config.ts:44 | CONFIRMED_FROM_CODE |
| FE-DELETEBYID-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG-ID | deleteById | DELETE | /api/v1/config/${id} | src/api/system/config.ts:57 | CONFIRMED_FROM_CODE |
| FE-REFRESHCACHE-SRC-API-SYSTEM-CONFIG-TS-API-V1-CONFIG-REFRESH | refreshCache | PUT | /api/v1/config/refresh | src/api/system/config.ts:64 | CONFIRMED_FROM_CODE |
| FE-GETLIST-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT | getList | GET | /api/v1/dept | src/api/system/dept.ts:14 | CONFIRMED_FROM_CODE |
| FE-GETOPTIONS-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT-OPTIONS | getOptions | GET | /api/v1/dept/options | src/api/system/dept.ts:23 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT-ID-FORM | getFormData | GET | /api/v1/dept/${id}/form | src/api/system/dept.ts:36 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT | add | POST | /api/v1/dept | src/api/system/dept.ts:49 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT-ID | update | PUT | /api/v1/dept/${id} | src/api/system/dept.ts:64 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-DEPT-TS-API-V1-DEPT-IDS | deleteByIds | DELETE | /api/v1/dept/${ids} | src/api/system/dept.ts:78 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-DICT-TS-API-V1-DICT-PAGE | getPage | GET | /api/v1/dict/page | src/api/system/dict.ts:14 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-DICT-TS-API-V1-DICT-ID-FORM | getFormData | GET | /api/v1/dict/${id}/form | src/api/system/dict.ts:28 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-DICT-TS-API-V1-DICT | add | POST | /api/v1/dict | src/api/system/dict.ts:40 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-DICT-TS-API-V1-DICT-ID | update | PUT | /api/v1/dict/${id} | src/api/system/dict.ts:54 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-DICT-TS-API-V1-DICT-IDS | deleteByIds | DELETE | /api/v1/dict/${ids} | src/api/system/dict.ts:67 | CONFIRMED_FROM_CODE |
| FE-GETLIST-SRC-API-SYSTEM-DICT-TS-API-V1-DICT-LIST | getList | GET | /api/v1/dict/list | src/api/system/dict.ts:79 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA-PAGE | getPage | GET | /api/v1/dict-data/page | src/api/system/dict-data.ts:14 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA-ID-FORM | getFormData | GET | /api/v1/dict-data/${id}/form | src/api/system/dict-data.ts:28 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA | add | POST | /api/v1/dict-data | src/api/system/dict-data.ts:40 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA-ID | update | PUT | /api/v1/dict-data/${id} | src/api/system/dict-data.ts:54 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA-IDS | deleteByIds | DELETE | /api/v1/dict-data/${ids} | src/api/system/dict-data.ts:67 | CONFIRMED_FROM_CODE |
| FE-GETOPTIONS-SRC-API-SYSTEM-DICT-DATA-TS-API-V1-DICT-DATA-DICTCODE-OPTIONS | getOptions | GET | /api/v1/dict-data/${dictCode}/options | src/api/system/dict-data.ts:80 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-LOG-TS-API-V1-LOGS-PAGE | getPage | GET | /api/v1/logs/page | src/api/system/log.ts:13 | CONFIRMED_FROM_CODE |
| FE-GETVISITTREND-SRC-API-SYSTEM-LOG-TS-API-V1-LOGS-VISIT-TREND | getVisitTrend | GET | /api/v1/logs/visit-trend | src/api/system/log.ts:27 | CONFIRMED_FROM_CODE |
| FE-GETVISITSTATS-SRC-API-SYSTEM-LOG-TS-API-V1-LOGS-VISIT-STATS | getVisitStats | GET | /api/v1/logs/visit-stats | src/api/system/log.ts:41 | CONFIRMED_FROM_CODE |
| FE-GETROUTES-SRC-API-SYSTEM-MENU-TS-MENU-GETMENUBYPOWERTREE | getRoutes | GET | /Menu/GetMenuByPowerTree | src/api/system/menu.ts:15 | CONFIRMED_FROM_CODE |
| FE-GETLIST-SRC-API-SYSTEM-MENU-TS-MENU | getList | GET | /Menu | src/api/system/menu.ts:28 | CONFIRMED_FROM_CODE |
| FE-GETOPTIONS-SRC-API-SYSTEM-MENU-TS-MENU-OPTIONS | getOptions | GET | /Menu/options | src/api/system/menu.ts:41 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-MENU-TS-MENU-ID-FORM | getFormData | GET | /Menu/${id}/form | src/api/system/menu.ts:54 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-MENU-TS-MENU | add | POST | /Menu | src/api/system/menu.ts:67 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-MENU-TS-MENU-ID | update | PUT | /Menu/${id} | src/api/system/menu.ts:82 | CONFIRMED_FROM_CODE |
| FE-DELETEBYID-SRC-API-SYSTEM-MENU-TS-MENU-ID | deleteById | DELETE | /Menu/${id} | src/api/system/menu.ts:96 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-PAGE | getPage | GET | /api/v1/notices/page | src/api/system/notice.ts:9 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-ID-FORM | getFormData | GET | /api/v1/notices/${id}/form | src/api/system/notice.ts:23 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES | add | POST | /api/v1/notices | src/api/system/notice.ts:36 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-ID | update | PUT | /api/v1/notices/${id} | src/api/system/notice.ts:50 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-IDS | deleteByIds | DELETE | /api/v1/notices/${ids} | src/api/system/notice.ts:63 | CONFIRMED_FROM_CODE |
| FE-PUBLISH-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-ID-PUBLISH | publish | PUT | /api/v1/notices/${id}/publish | src/api/system/notice.ts:76 | CONFIRMED_FROM_CODE |
| FE-REVOKE-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-ID-REVOKE | revoke | PUT | /api/v1/notices/${id}/revoke | src/api/system/notice.ts:89 | CONFIRMED_FROM_CODE |
| FE-GETDETAIL-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-ID-DETAIL | getDetail | GET | /api/v1/notices/${id}/detail | src/api/system/notice.ts:100 | CONFIRMED_FROM_CODE |
| FE-READALL-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-READ-ALL | readAll | PUT | /api/v1/notices/read-all | src/api/system/notice.ts:108 | CONFIRMED_FROM_CODE |
| FE-GETMYNOTICEPAGE-SRC-API-SYSTEM-NOTICE-TS-API-V1-NOTICES-MY-PAGE | getMyNoticePage | GET | /api/v1/notices/my-page | src/api/system/notice.ts:116 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-PAGE | getPage | GET | /api/v1/roles/page | src/api/system/role.ts:9 | CONFIRMED_FROM_CODE |
| FE-GETOPTIONS-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-OPTIONS | getOptions | GET | /api/v1/roles/options | src/api/system/role.ts:18 | CONFIRMED_FROM_CODE |
| FE-GETROLEMENUIDS-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-ROLEID-MENUIDS | getRoleMenuIds | GET | /api/v1/roles/${roleId}/menuIds | src/api/system/role.ts:30 | CONFIRMED_FROM_CODE |
| FE-UPDATEROLEMENUS-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-ROLEID-MENUS | updateRoleMenus | PUT | /api/v1/roles/${roleId}/menus | src/api/system/role.ts:43 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-ID-FORM | getFormData | GET | /api/v1/roles/${id}/form | src/api/system/role.ts:57 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES | add | POST | /api/v1/roles | src/api/system/role.ts:65 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-ID | update | PUT | /api/v1/roles/${id} | src/api/system/role.ts:79 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-ROLE-TS-API-V1-ROLES-IDS | deleteByIds | DELETE | /api/v1/roles/${ids} | src/api/system/role.ts:92 | CONFIRMED_FROM_CODE |
| FE-GETPAGE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-PAGE | getPage | GET | /api/v1/users/page | src/api/system/user.ts:25 | CONFIRMED_FROM_CODE |
| FE-GETFORMDATA-SRC-API-SYSTEM-USER-TS-API-V1-USERS-USERID-FORM | getFormData | GET | /api/v1/users/${userId}/form | src/api/system/user.ts:39 | CONFIRMED_FROM_CODE |
| FE-ADD-SRC-API-SYSTEM-USER-TS-API-V1-USERS | add | POST | /api/v1/users | src/api/system/user.ts:51 | CONFIRMED_FROM_CODE |
| FE-UPDATE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-ID | update | PUT | /api/v1/users/${id} | src/api/system/user.ts:65 | CONFIRMED_FROM_CODE |
| FE-RESETPASSWORD-SRC-API-SYSTEM-USER-TS-API-V1-USERS-ID-PASSWORD-RESET | resetPassword | PUT | /api/v1/users/${id}/password/reset | src/api/system/user.ts:79 | CONFIRMED_FROM_CODE |
| FE-DELETEBYIDS-SRC-API-SYSTEM-USER-TS-API-V1-USERS-IDS | deleteByIds | DELETE | /api/v1/users/${ids} | src/api/system/user.ts:92 | CONFIRMED_FROM_CODE |
| FE-DOWNLOADTEMPLATE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-TEMPLATE | downloadTemplate | GET | /api/v1/users/template | src/api/system/user.ts:100 | CONFIRMED_FROM_CODE |
| FE-EXPORT-SRC-API-SYSTEM-USER-TS-API-V1-USERS-EXPORT | export | GET | /api/v1/users/export | src/api/system/user.ts:113 | CONFIRMED_FROM_CODE |
| FE-IMPORT-SRC-API-SYSTEM-USER-TS-API-V1-USERS-IMPORT | import | POST | /api/v1/users/import | src/api/system/user.ts:130 | CONFIRMED_FROM_CODE |
| FE-GETPROFILE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-PROFILE | getProfile | GET | /api/v1/users/profile | src/api/system/user.ts:143 | CONFIRMED_FROM_CODE |
| FE-UPDATEPROFILE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-PROFILE | updateProfile | PUT | /api/v1/users/profile | src/api/system/user.ts:151 | CONFIRMED_FROM_CODE |
| FE-CHANGEPASSWORD-SRC-API-SYSTEM-USER-TS-API-V1-USERS-PASSWORD | changePassword | PUT | /api/v1/users/password | src/api/system/user.ts:160 | CONFIRMED_FROM_CODE |
| FE-SENDMOBILECODE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-MOBILE-CODE | sendMobileCode | POST | /api/v1/users/mobile/code | src/api/system/user.ts:169 | CONFIRMED_FROM_CODE |
| FE-BINDORCHANGEMOBILE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-MOBILE | bindOrChangeMobile | PUT | /api/v1/users/mobile | src/api/system/user.ts:178 | CONFIRMED_FROM_CODE |
| FE-SENDEMAILCODE-SRC-API-SYSTEM-USER-TS-API-V1-USERS-EMAIL-CODE | sendEmailCode | POST | /api/v1/users/email/code | src/api/system/user.ts:187 | CONFIRMED_FROM_CODE |
| FE-BINDORCHANGEEMAIL-SRC-API-SYSTEM-USER-TS-API-V1-USERS-EMAIL | bindOrChangeEmail | PUT | /api/v1/users/email | src/api/system/user.ts:196 | CONFIRMED_FROM_CODE |
| FE-GETOPTIONS-SRC-API-SYSTEM-USER-TS-API-V1-USERS-OPTIONS | getOptions | GET | /api/v1/users/options | src/api/system/user.ts:207 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMISSIONLIST-SRC-API-TASK-MISSION-TS-MISSION-GETPAGEMISSIONLIST | GetPageMissionList | POST | /Mission/GetPageMissionList | src/api/task/mission.ts:6 | CONFIRMED_FROM_CODE |
| FE-ADDMISSION-SRC-API-TASK-MISSION-TS-MISSION-ADDMISSION | AddMission | POST | /Mission/AddMission | src/api/task/mission.ts:13 | CONFIRMED_FROM_CODE |
| FE-UPDATEMISSION-SRC-API-TASK-MISSION-TS-MISSION-UPDATEMISSION | UpdateMission | POST | /Mission/UpdateMission | src/api/task/mission.ts:20 | CONFIRMED_FROM_CODE |
| FE-REFRESHMAP-SRC-API-TASK-MISSION-TS-CTRL-REFRESHMAP | RefreshMap | GET | /ctrl/RefreshMap | src/api/task/mission.ts:28 | CONFIRMED_FROM_CODE |
| FE-DELETEMISSION-SRC-API-TASK-MISSION-TS-MISSION-DELETEMISSION | DeleteMission | POST | /Mission/DeleteMission | src/api/task/mission.ts:40 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMISSIONCLASSNAME-SRC-API-TASK-MISSION-TS-MISSION-GETPAGEMISSIONCLASSNAME | GetPageMissionClassName | GET | /Mission/GetPageMissionClassName | src/api/task/mission.ts:47 | CONFIRMED_FROM_CODE |
| FE-GETMISSIONRUNNINGSTATUS-SRC-API-TASK-MISSION-TS-MISSION-GETMISSIONRUNNINGSTATUS | GetMissionRunningStatus | GET | /Mission/GetMissionRunningStatus | src/api/task/mission.ts:54 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMISSIONCLASSANDNAME-SRC-API-TASK-MISSION-TS-MISSION-GETPAGEMISSIONCLASSANDNAME | GetPageMissionClassAndName | GET | /Mission/GetPageMissionClassAndName | src/api/task/mission.ts:60 | CONFIRMED_FROM_CODE |
| FE-GETMISSIONCONFIGSCHEMA-SRC-API-TASK-MISSION-TS-MISSION-GETMISSIONCONFIGSCHEMA | GetMissionConfigSchema | GET | /Mission/GetMissionConfigSchema | src/api/task/mission.ts:71 | CONFIRMED_FROM_CODE |
| FE-GETPAGESTRATEGYLIST-SRC-API-TASK-STRATEGY-TS-STRATEGY-GETPAGESTRATEGYLIST | GetPageStrategyList | POST | /Strategy/GetPageStrategyList | src/api/task/strategy.ts:5 | CONFIRMED_FROM_CODE |
| FE-ADDSYSSTRATEGY-SRC-API-TASK-STRATEGY-TS-STRATEGY-ADDSYSSTRATEGY | AddSysStrategy | POST | /Strategy/AddSysStrategy | src/api/task/strategy.ts:12 | CONFIRMED_FROM_CODE |
| FE-UPDATESYSSTRATEGY-SRC-API-TASK-STRATEGY-TS-STRATEGY-UPDATESYSSTRATEGY | UpdateSysStrategy | POST | /Strategy/UpdateSysStrategy | src/api/task/strategy.ts:20 | CONFIRMED_FROM_CODE |
| FE-DELETESYSSTRATEGY-SRC-API-TASK-STRATEGY-TS-STRATEGY-DELETESYSSTRATEGY | DeleteSysStrategy | POST | /Strategy/DeleteSysStrategy | src/api/task/strategy.ts:28 | CONFIRMED_FROM_CODE |
| FE-GETPAGETASKLIST-SRC-API-TASK-TASK-TS-TASK-GETPAGETASKLIST | GetPageTaskList | POST | /Task/GetPageTaskList | src/api/task/task.ts:6 | CONFIRMED_FROM_CODE |
| FE-GETTASKBYTASKCODE-SRC-API-TASK-TASK-TS-TASK-GETTASKBYTASKCODE | GetTaskByTaskCode | GET | /Task/GetTaskByTaskCode | src/api/task/task.ts:13 | CONFIRMED_FROM_CODE |
| FE-GETCARFAULTBYTASKRANGE-SRC-API-TASK-TASK-TS-CARFAULT-GETBYTASKRANGE | GetCarFaultByTaskRange | GET | /CarFault/GetByTaskRange | src/api/task/task.ts:20 | CONFIRMED_FROM_CODE |
| FE-ADDTASK-SRC-API-TASK-TASK-TS-TASK-ADDTASK | AddTask | POST | /Task/AddTask | src/api/task/task.ts:27 | CONFIRMED_FROM_CODE |
| FE-PUSHTASK-SRC-API-TASK-TASK-TS-TASK-PUSHTASK | PushTask | POST | /task/PushTask | src/api/task/task.ts:34 | CONFIRMED_FROM_CODE |
| FE-GETTASKDETAILBYTASKCODE-SRC-API-TASK-TASK-TS-TASK-GETTASKDETAILBYTASKCODE | GetTaskDetailByTaskCode | GET | /Task/GetTaskDetailByTaskCode | src/api/task/task.ts:44 | CONFIRMED_FROM_CODE |
| FE-UPDATETASKPRIORITY-SRC-API-TASK-TASK-TS-TASK-UPDATETASKPRIORITY | UpdateTaskPriority | POST | /Task/UpdateTaskPriority | src/api/task/task.ts:51 | CONFIRMED_FROM_CODE |
| FE-PUSHCHARGEPRIORITY-SRC-API-TASK-TASK-TS-TASK-PUSHCHARGEPRIORITY | PushChargePriority | POST | /task/PushChargePriority | src/api/task/task.ts:58 | CONFIRMED_FROM_CODE |
| FE-RESENDTASK-SRC-API-TASK-TASK-TS-TASK-RESENDTASK | ResendTask | POST | /Task/ResendTask | src/api/task/task.ts:68 | CONFIRMED_FROM_CODE |
| FE-CANCELTASK-SRC-API-TASK-TASK-TS-TASK-CANCELTASK | CancelTask | POST | /Task/CancelTask | src/api/task/task.ts:75 | CONFIRMED_FROM_CODE |
| FE-PUSHTASKCANCEL-SRC-API-TASK-TASK-TS-TASK-PUSHTASKCANCEL | PushTaskCancel | POST | /task/PushTaskCancel | src/api/task/task.ts:83 | CONFIRMED_FROM_CODE |
| FE-FORCEDCOMPLETE-SRC-API-TASK-TASK-TS-TASK-FORCEDCOMPLETE | ForcedComplete | POST | /Task/ForcedComplete | src/api/task/task.ts:93 | CONFIRMED_FROM_CODE |
| FE-GETPAGETASKMAINTANANCLIST-SRC-API-TASK-TASKMAINTANANCE-TS-TASKMAINTANANC-GETPAGETASKMAINTANANCLIST | GetPageTaskMaintanancList | POST | /TaskMaintananc/GetPageTaskMaintanancList | src/api/task/taskmaintanance.ts:6 | CONFIRMED_FROM_CODE |
| FE-WEEKLYTASKMAINTANANCCOUNT-SRC-API-TASK-TASKMAINTANANCE-TS-TASKMAINTANANC-WEEKLYTASKMAINTANANCCOUNT | WeeklyTaskMaintanancCount | GET | /TaskMaintananc/WeeklyTaskMaintanancCount | src/api/task/taskmaintanance.ts:13 | CONFIRMED_FROM_CODE |
| FE-GETPAGETASKTEMLIST-SRC-API-TASK-TASKTEM-TS-TMP-GETPAGETEMPLIST | GetPageTaskTemList | POST | /Tmp/GetPageTempList | src/api/task/taskTem.ts:5 | CONFIRMED_FROM_CODE |
| FE-ADDTASKTEM-SRC-API-TASK-TASKTEM-TS-TMP-ADDTEMP | AddTaskTem | POST | /Tmp/AddTemp | src/api/task/taskTem.ts:12 | CONFIRMED_FROM_CODE |
| FE-GETTASKTEMNUMBYTMPCODE-SRC-API-TASK-TASKTEM-TS-TMPSTEP-GETTASKTEMPNUMBYTMPCODE | GetTaskTemNumByTmpCode | GET | /TmpStep/GetTaskTempNumByTmpCode | src/api/task/taskTem.ts:19 | CONFIRMED_FROM_CODE |
| FE-GETTASKTEMSTEPANDROUTE-SRC-API-TASK-TASKTEM-TS-TMP-GETTEMPSTEPANDROUTE | GetTaskTemStepAndRoute | GET | /Tmp/GetTempStepAndRoute | src/api/task/taskTem.ts:26 | CONFIRMED_FROM_CODE |
| FE-GETALLTASKTEM-SRC-API-TASK-TASKTEM-TS-TMP-GETALLTEMP | GetAllTaskTem | GET | /Tmp/GetAllTemp | src/api/task/taskTem.ts:33 | CONFIRMED_FROM_CODE |
| FE-ADDTASKTEMSTEPANDROUTE-SRC-API-TASK-TASKTEM-TS-TMP-ADDTASKTEMSTEPANDROUTE | AddTaskTemStepandRoute | POST | /Tmp/AddTaskTemStepandRoute | src/api/task/taskTem.ts:39 | CONFIRMED_FROM_CODE |
| FE-UPDATETASKTEM-SRC-API-TASK-TASKTEM-TS-TMP-UPDATETEMP | UpdateTaskTem | POST | /Tmp/UpdateTemp | src/api/task/taskTem.ts:46 | CONFIRMED_FROM_CODE |
| FE-DELETETASKTEM-SRC-API-TASK-TASKTEM-TS-TMP-DELETETEMP | DeleteTaskTem | POST | /Tmp/DeleteTemp | src/api/task/taskTem.ts:53 | CONFIRMED_FROM_CODE |
| FE-GETPAGETASKTEMITEMLIST-SRC-API-TASK-TASKTEMITEM-TS-TMPITEM-GETPAGETASKTEMPITEMLIST | GetPageTaskTemItemList | POST | /TmpItem/GetPageTaskTempItemList | src/api/task/taskTemItem.ts:5 | CONFIRMED_FROM_CODE |
| FE-GETTASKTEMITEMLIST-SRC-API-TASK-TASKTEMITEM-TS-TMPITEM-GETTASKTEMPITEMLIST | GetTaskTemItemList | GET | /TmpItem/GetTaskTempItemList | src/api/task/taskTemItem.ts:12 | CONFIRMED_FROM_CODE |
| FE-ADDTASKTEMITEM-SRC-API-TASK-TASKTEMITEM-TS-TMPITEM-ADDTASKTEMPITEM | AddTaskTemItem | POST | /TmpItem/AddTaskTempItem | src/api/task/taskTemItem.ts:18 | CONFIRMED_FROM_CODE |
| FE-UPDATETASKTEMITEM-SRC-API-TASK-TASKTEMITEM-TS-TMPITEM-UPDATETASKTEMPITEM | UpdateTaskTemItem | POST | /TmpItem/UpdateTaskTempItem | src/api/task/taskTemItem.ts:25 | CONFIRMED_FROM_CODE |
| FE-DELETETASKTEMITEM-SRC-API-TASK-TASKTEMITEM-TS-TMPITEM-DELETETASKTEMPITEM | DeleteTaskTemItem | POST | /TmpItem/DeleteTaskTempItem | src/api/task/taskTemItem.ts:32 | CONFIRMED_FROM_CODE |
| FE-GETMAPFILELIST-SRC-MODULES-DRAW-API-MAP-JS-INFO-GETMAPFILELIST | GetMapFileList | GET | /info/GetMapFileList | src/modules/draw/api/map.js:34 | CONFIRMED_FROM_CODE |
| FE-GETMAPFILE-SRC-MODULES-DRAW-API-MAP-JS-INFO-GETMAPFILE | GetMapFile | GET | /info/GetMapFile | src/modules/draw/api/map.js:50 | CONFIRMED_FROM_CODE |
| FE-GETMAP-SRC-MODULES-DRAW-API-MAP-JS-MAP-GETMAP | GetMap | GET | /Map/GetMap | src/modules/draw/api/map.js:62 | CONFIRMED_FROM_CODE |
| FE-ADDMAP-SRC-MODULES-DRAW-API-MAP-JS-MAP-ADDMAP | AddMap | POST | /Map/AddMap | src/modules/draw/api/map.js:78 | CONFIRMED_FROM_CODE |
| FE-UPDATEMAP-SRC-MODULES-DRAW-API-MAP-JS-MAP-UPDATEMAP | UpdateMap | POST | /Map/UpdateMap | src/modules/draw/api/map.js:95 | CONFIRMED_FROM_CODE |
| FE-ADDMAPDATA-SRC-MODULES-DRAW-API-MAP-JS-MAP-ADDMAPDATA | AddMapData | POST | /Map/AddMapData | src/modules/draw/api/map.js:112 | CONFIRMED_FROM_CODE |
| FE-PUBLISHMAPDATA-SRC-MODULES-DRAW-API-MAP-JS-MAP-PUBLISHMAPDATA | PublishMapData | POST | /Map/PublishMapData | src/modules/draw/api/map.js:129 | CONFIRMED_FROM_CODE |
| FE-UPDATEPATH-SRC-MODULES-DRAW-API-MAP-JS-MAP-UPDATEPATH | UpdatePath | POST | /Map/UpdatePath | src/modules/draw/api/map.js:146 | CONFIRMED_FROM_CODE |
| FE-QUICKCURVEOPTIMIZATION-SRC-MODULES-DRAW-API-MAP-JS-TRACK-QUICKCURVEOPTIMIZATION | QuickCurveOptimization | POST | /Track/QuickCurveOptimization | src/modules/draw/api/map.js:157 | CONFIRMED_FROM_CODE |
| FE-BESTCURVEOPTIMIZATIO-SRC-MODULES-DRAW-API-MAP-JS-TRACK-BESTCURVEOPTIMIZATIO | BestCurveOptimizatio | POST | /Track/BestCurveOptimizatio | src/modules/draw/api/map.js:168 | CONFIRMED_FROM_CODE |
| FE-UPDATESITE-SRC-MODULES-DRAW-API-MAP-JS-MAP-UPDATESITE | UpdateSite | POST | /map/UpdateSite | src/modules/draw/api/map.js:185 | CONFIRMED_FROM_CODE |
| FE-SAVEMAPDATA-SRC-MODULES-DRAW-API-MAP-JS-MAP-SAVEMAPDATA | SaveMapData | POST | /Map/SaveMapData | src/modules/draw/api/map.js:202 | CONFIRMED_FROM_CODE |
| FE-GETMAPDATA-SRC-MODULES-DRAW-API-MAP-JS-MAP-GETMAPDATA | GetMapData | POST | /Map/GetMapData | src/modules/draw/api/map.js:228 | CONFIRMED_FROM_CODE |
| FE-REFRESHMAP-SRC-MODULES-DRAW-API-MAP-JS-CTRL-REFRESHMAP | RefreshMap | GET | /ctrl/RefreshMap | src/modules/draw/api/map.js:259 | CONFIRMED_FROM_CODE |
| FE-GETPAGEMAPLIST-SRC-MODULES-DRAW-API-MAP-JS-MAP-GETPAGEMAPLIST | GetPageMapList | POST | /Map/GetPageMapList | src/modules/draw/api/map.js:272 | CONFIRMED_FROM_CODE |
| FE-GETMAPBYMAPCODE-SRC-MODULES-DRAW-API-MAP-JS-MAP-GETMAPBYMAPCODE | GetMapByMapCode | GET | /Map/GetMapByMapCode | src/modules/draw/api/map.js:288 | CONFIRMED_FROM_CODE |
| FE-GETPATHBYSITEID-SRC-MODULES-DRAW-API-MAP-JS-MAP-GETPATHBYSITEID | GetPathBySiteId | GET | /Map/GetPathBySiteId | src/modules/draw/api/map.js:305 | CONFIRMED_FROM_CODE |
| FE-SITEISEXIST-SRC-MODULES-DRAW-API-MAP-JS-MAP-SITEISEXIST | SiteIsExist | GET | /Map/SiteIsExist | src/modules/draw/api/map.js:322 | CONFIRMED_FROM_CODE |
| FE-GETMETA-SRC-MODULES-DRAW-API-PROPMETA-JS-PROPMETA-GETMETA | GetMeta | GET | /PropMeta/GetMeta | src/modules/draw/api/propMeta.js:22 | CONFIRMED_FROM_CODE |
| FE-GETLAYERS-SRC-MODULES-DRAW-API-PROPMETA-JS-PROPMETA-GETLAYERS | GetLayers | GET | /PropMeta/GetLayers | src/modules/draw/api/propMeta.js:34 | CONFIRMED_FROM_CODE |
| FE-INVOKEACTION-SRC-MODULES-DRAW-API-PROPMETA-JS-PROPMETA-INVOKEACTION | InvokeAction | POST | /PropMeta/InvokeAction | src/modules/draw/api/propMeta.js:49 | CONFIRMED_FROM_CODE |
| FE-QUICKCURVEOPTIMIZATION-SRC-MODULES-DRAW-API-TRACK-JS-TRACK-QUICKCURVEOPTIMIZATION | QuickCurveOptimization | POST | /Track/QuickCurveOptimization | src/modules/draw/api/track.js:24 | CONFIRMED_FROM_CODE |
| FE-BESTCURVEOPTIMIZATION-SRC-MODULES-DRAW-API-TRACK-JS-TRACK-BESTCURVEOPTIMIZATIO | BestCurveOptimization | POST | /Track/BestCurveOptimizatio | src/modules/draw/api/track.js:33 | CONFIRMED_FROM_CODE |

## Response/error conventions

- 前端 `src/utils/request.ts` 以 `response.data.statusCode === 200 && isSuccess` 作为成功条件；二进制 `blob` 响应直接返回。
- `statusCode == 600` 会提示重新登录、清理用户数据并跳转 `/login`；其它业务错误由 Element Plus `ElMessage` 展示。
- 后端 Areas 基类返回 `ApiResult`；未统一确认所有 Controller 的 body schema，故未将所有结果包装字段强行归纳为单一 DTO。
