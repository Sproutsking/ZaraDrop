import { Fragment, lazy, Suspense, useState, useEffect, useRef, useContext, createContext } from "react";
import { EyeOff, User, Search, Star, Clock, MapPin, Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Volume2, MessageCircle, MessageSquareText, Send, X, ShieldCheck, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown, Check, Wallet, Banknote, Navigation, Bell, BarChart3, ArrowDownLeft, ArrowUpRight, LogOut, Landmark, Headset, Settings, Moon, Sun, Monitor, Bike, Store, FileCheck, Zap, Trophy, Share2, Crown, Lock, Eye, Radio, Pencil, Menu, Package, Route, Timer, KeyRound, Info, Trash2 } from "lucide-react";
import { claimRiderOrder, getRiderAvailability, listAvailableRiderOrders, listOrderMessages, listRiderOrders, sendOrderMessage, setRiderAvailability, setRiderOrderStatus, subscribeToOrderMessages, subscribeToOrders, supabase } from "@zaradrop/core";
import { DemoNotice, ProfileEditor, Timeline, useAuthenticatedProfile } from "@zaradrop/ui";
import ActiveDelivery from "./sections/orders/ActiveDelivery.jsx";

/* ═════════ DESIGN SYSTEM (shared by all four Dispatch apps) ═════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap');
.dl,.dlp{--bg:#050506;--s1:#0d0d10;--s2:#15151a;--s3:#1f1f26;--bd:#26262e;--bh:#3c3c49;--tx:#f4f4f6;--mu:#a3a3b0;--ac:#8f63ff;--at:#b79bff;--acx:#ffffff;--ag:linear-gradient(180deg,#9a73ff 0%,#7d4fff 100%);--as:rgba(143,99,255,.12);--ab:rgba(143,99,255,.5);--dng:#f87171;--dgs:rgba(248,113,113,.12);--wrn:#fbbf24;--wns:rgba(251,191,36,.12);--inf:#60a5fa;--ins:rgba(96,165,250,.12);--bub:#17171c;--bdg:#ef4444;--ov:rgba(0,0,0,.7);color-scheme:dark}
.lt{--bg:#f5f5f8;--s1:#ffffff;--s2:#eeeef3;--s3:#e0e0e8;--bd:#d8d8e2;--bh:#b3b3c3;--tx:#121216;--mu:#585866;--ac:#6d3df5;--at:#5a2bd8;--acx:#ffffff;--ag:linear-gradient(180deg,#7a4dff 0%,#6234ec 100%);--as:rgba(109,61,245,.09);--ab:rgba(90,43,216,.45);--dng:#c81e1e;--dgs:rgba(220,38,38,.09);--wrn:#a8480a;--wns:rgba(217,119,6,.13);--inf:#1d4ed8;--ins:rgba(29,78,216,.09);--bub:#ececf1;--bdg:#e11d48;--ov:rgba(18,18,22,.45);color-scheme:light}
.dl{min-height:100vh;background:var(--bg);color:var(--tx);font:14px/1.5 'DM Sans',system-ui,sans-serif}.dlp{color:var(--tx);font:14px/1.5 'DM Sans',system-ui,sans-serif}
:where(.dl,.dlp) *{box-sizing:border-box}:where(.dl,.dlp) button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;text-align:inherit}:where(.dl,.dlp) :is(h1,h2,h3,p){margin:0}:where(.dl,.dlp) input,:where(.dl,.dlp) select{font:inherit}:where(.dl,.dlp) svg{flex:none}
.mu{color:var(--mu)}.ac{color:var(--at)}.mono{font-family:'JetBrains Mono',monospace}.xs{font-size:11px}.b{font-weight:700}.fl{flex:1;min-width:0}.tr{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.serif{font-family:Fraunces,Georgia,serif}
.row{display:flex;align-items:center;gap:10px}.col{display:flex;flex-direction:column;gap:14px}
.lb{font:500 10.5px 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--mu)}
/* buttons: always visible border + fill, hover only changes colour (no glow) */
.bt{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:42px;padding:0 18px;border-radius:999px;border:1px solid var(--bh);background:var(--s2);color:var(--tx);font-weight:600;font-size:13px;white-space:nowrap;transition:background .15s,border-color .15s,color .15s,transform .1s}
.bt:hover:not(:disabled){border-color:var(--ac);color:var(--at)}.bt:active:not(:disabled){transform:scale(.98)}
.bt.p{background:var(--ag);border-color:var(--ac);color:var(--acx)}.bt.p:hover:not(:disabled){filter:brightness(1.07);color:var(--acx)}
.bt.o{background:transparent;border-color:var(--ab);color:var(--at)}.bt.o:hover:not(:disabled){background:var(--as)}
.bt.r{background:var(--dgs);border-color:transparent;color:var(--dng)}.bt.r:hover:not(:disabled){border-color:var(--dng);color:var(--dng)}
.bt.s{height:34px;padding:0 15px;font-size:12.5px}.bt.w{width:auto;min-width:148px;padding:0 26px;align-self:flex-start}.bt.xl{height:52px;padding:0 34px;font-size:15px;font-weight:800}.sh .bt.w,.fs .bt.w,.fb .bt.w{align-self:center}.bt:disabled{opacity:.45;cursor:not-allowed}
.ib{position:relative;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--bd);background:var(--s2);color:var(--tx);transition:background .15s,border-color .15s,color .15s}.ib:hover:not(:disabled){border-color:var(--ac);color:var(--at)}.ib:disabled{opacity:.45;cursor:not-allowed}
.ib.g{background:var(--ag);color:var(--acx);border-color:var(--ac)}.ib.g:hover:not(:disabled){color:var(--acx);filter:brightness(1.07)}
/* count badge: hangs off the top-right corner of its icon */
.bdg{position:absolute;top:-6px;right:-8px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--bdg);color:#fff;font-size:10.5px;font-weight:800;line-height:1;display:grid;place-items:center;border:2px solid var(--bg);pointer-events:none}
.ib .bdg{top:-5px;right:-5px}.ct2 .bdg,.ni .bdg,.nv .bdg{border-color:var(--s1)}.ni .bdg{top:-8px;right:-11px}
.ch{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--bd);color:var(--mu);white-space:nowrap}.ch.g{color:var(--at);border-color:var(--ab);background:var(--as)}.ch.o{color:var(--wrn);background:var(--wns);border-color:transparent}.ch.r{color:var(--dng);background:var(--dgs);border-color:transparent}.ch.bl{color:var(--inf);background:var(--ins);border-color:transparent}
.av{width:var(--s,40px);height:var(--s,40px);border-radius:50%;display:grid;place-items:center;font-weight:800;color:#0c0818;font-size:calc(var(--s,40px)*.4);background:linear-gradient(135deg,var(--g1),var(--g2));flex:none;position:relative}.av i{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--ag);border:2px solid var(--s1)}
.cd{position:relative;border:1px solid var(--bd);border-radius:20px;background:var(--s1);padding:16px;animation:dlfd .35s backwards;transition:border-color .2s}.cd.hl{border-color:var(--ab)}.cd.hv:hover{border-color:var(--ab)}
.em{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;font-size:28px;background:var(--s2);border:1px solid var(--bd);flex:none}.em.sm{width:44px;height:44px;font-size:22px;border-radius:14px}
.st{display:flex;gap:4px;margin:12px 0 6px}.st i{flex:1;height:5px;border-radius:3px;background:var(--s3)}.st i.d,.st i.n{background:var(--ag)}.st i.n{animation:dlbl 1.2s infinite}
.kp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.kp>div{border:1px solid var(--bd);border-radius:14px;padding:12px 8px;text-align:center;background:var(--s1);min-width:0}.kp b{display:block;font-size:clamp(14px,4.2vw,20px);letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pb{height:8px;border-radius:5px;background:var(--s3);overflow:hidden}.pb i{display:block;height:100%;border-radius:5px;background:var(--ag);transition:width .5s}
.rk{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--bd)}.rk:first-child{border-top:0}.lb+.rk{border-top:0}
.rk.me{background:var(--as);border-radius:12px;padding:11px 10px;margin:2px -10px;border-top:0}
.map{position:relative;height:170px;border-radius:18px;overflow:hidden;border:1px solid var(--bd);background:var(--s2) linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px);background-size:100% 100%,26px 26px,26px 26px}.map svg{position:absolute;inset:0;width:100%;height:100%}
.pin{position:absolute;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--s1);border:2px solid var(--ac);transform:translate(-50%,-50%);transition:left 1.5s,top 1.5s}
/* shell */
.lay{display:flex;justify-content:center;min-height:100vh;width:100%;max-width:1840px;margin:0 auto;border-right:1px solid var(--bd)}
.nv{position:sticky;top:0;height:100vh;height:100dvh;width:88px;flex:none;border-right:1px solid var(--bd);padding:16px 10px;display:flex;flex-direction:column;gap:6px;background:var(--s1);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}.nv::-webkit-scrollbar{display:none}.nv>*{flex:none}.ni.mr{display:none}
.brand{display:flex;align-items:center;gap:10px;margin:0 auto 14px}.brand div{display:none}.brand b{display:block;font:700 18px Fraunces,serif;letter-spacing:-.01em}
.lg{width:40px;height:44px;display:grid;place-items:center;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:var(--ag);color:var(--acx);font-weight:800;flex:none}
.ni{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;border-radius:16px;color:var(--mu);font-size:10.5px;font-weight:600;transition:color .15s}
.ni .ic{display:grid;place-items:center;width:46px;height:32px;border-radius:12px;transition:background .15s}.ni .iw{position:relative;display:grid;place-items:center}
.ni:hover{color:var(--tx)}.ni:hover .ic{background:var(--s2)}.ni.on{color:var(--at)}.ni.on .ic{background:var(--as)}.ni.lk{opacity:.45}
.nvf{margin-top:auto;display:none;padding:12px 14px;border:1px solid var(--bd);border-radius:18px;background:var(--bg)}
.mn{--px:14px;flex:1;min-width:0;max-width:calc(var(--mw,780px) + 300px);width:100%;padding:0 var(--px) calc(100px + env(safe-area-inset-bottom))}
.hdr{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;margin:0 calc(var(--px)*-1) 16px;padding:calc(10px + env(safe-area-inset-top)) var(--px) 10px;background:var(--bg);border-bottom:1px solid var(--bd)}
.pf{display:flex;align-items:center;gap:10px;min-width:0;border-radius:999px;padding:2px 12px 2px 2px;transition:background .15s}.pf:hover{background:var(--s2)}.pf .t{min-width:0;line-height:1.25}.pf .t b{display:block;font-size:14px}.pf .t span{font-size:11.5px;color:var(--mu)}
.sd{display:none;width:300px;flex:none;position:sticky;top:0;height:100vh;overflow-y:auto;padding:22px 20px 40px;scrollbar-width:none}
.sd .cd{padding:14px}.sd h3{font-size:15px}
.bn{display:none}
@media(min-width:700px){.mn{--px:22px;padding-bottom:60px;border-right:1px solid var(--bd)}}
/* stage 1 · tablet 700-1099: icon over name, rail 88px, extras behind More */
@media(min-width:700px) and (max-width:1099px){.nv .ni.xt{display:none}.nv .ni.mr{display:flex}.ni{padding:7px 0}.ni .lt{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}}
/* stage 2 · laptop 1100+: icon beside name, full list scrolls */
@media(min-width:1100px){.nv{width:208px;padding:18px 12px}.brand{margin:0 0 14px 4px}.brand div{display:block}.ni{flex-direction:row;gap:11px;padding:5px 10px 5px 5px;font-size:13.5px}.ni .ic{width:38px;height:34px}.ni.on{background:var(--as)}.nv .ni.on .ic{background:transparent;border-color:transparent}.nv .ni.on:before{content:"";position:absolute;left:-12px;top:9px;bottom:9px;width:3px;border-radius:0 3px 3px 0;background:var(--ag)}.mn{--px:24px}}
/* stage 3 · desktop 1280+: footer card and roomier gutters */
@media(min-width:1280px){.nv{width:236px;padding:20px 14px}.nv .ni.on:before{left:-14px}.nvf{display:block}.mn{--px:28px}}
/* trending panel stays from 1000px as before; it grows with the screen */
@media(min-width:1000px){.sd{display:flex;flex-direction:column;gap:10px;width:260px;padding:20px 16px 40px}}@media(min-width:1100px){.sd{width:284px;padding:22px 18px 40px}}@media(min-width:1280px){.sd{width:340px;padding:22px 22px 40px}}
@media(max-width:699px){.nv{display:none}.cd{border-radius:18px}
.bn{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;gap:4px;padding:10px 8px calc(10px + env(safe-area-inset-bottom));background:var(--s1);border:1px solid var(--bd);border-bottom:0;border-radius:24px 24px 0 0}
.bn .ni{flex:1;height:56px;padding:0;justify-content:center;gap:3px;border-radius:16px}.bn .ni .ic{width:56px;height:30px;border-radius:15px}
.bn .ni.on:before{content:"";position:absolute;top:-11px;left:50%;width:24px;height:3px;border-radius:0 0 4px 4px;background:var(--ag);transform:translateX(-50%)}.bn .ni.on .lt{font-weight:800}}
.ni .ic{border:1px solid transparent}.ni.on .ic{border-color:var(--ab);background:linear-gradient(180deg,var(--as),transparent 150%)}
html,body{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none}
.dl *,.dlp *{scrollbar-width:none;-ms-overflow-style:none}.dl *::-webkit-scrollbar,.dlp *::-webkit-scrollbar{width:0;height:0;display:none}
.sw,.sw *{transition:background-color .45s ease,border-color .45s ease,color .45s ease,fill .45s ease,stroke .45s ease!important}
.sgn{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:6px}.so{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 26px;border-radius:999px;border:1px solid color-mix(in srgb,var(--dng) 50%,transparent);background:transparent;color:var(--dng);font-weight:700;font-size:13.5px;transition:background-color .15s,border-color .15s}.so:hover{background:var(--dgs);border-color:var(--dng)}
.pa{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--bd);border-radius:18px;background:var(--s1)}.pa.def{border-color:var(--ab)}
/* dropdown */
.dr{position:relative;display:inline-block}.drb{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 14px;border-radius:999px;border:1px solid var(--bd);background:var(--s1);font-size:13px;white-space:nowrap;transition:border-color .15s,background .15s}.drb:hover{border-color:var(--bh)}.drb.on{border-color:var(--ab);background:var(--as)}.drb .mu{font-size:12px}.drb b{font-weight:700}.drb svg:last-child{color:var(--mu);transition:transform .15s}.drb.on svg:last-child{transform:rotate(180deg)}
.drm{position:absolute;top:calc(100% + 6px);left:0;z-index:70;min-width:max(100%,200px);max-height:320px;overflow-y:auto;padding:6px;border:1px solid var(--bh);border-radius:16px;background:var(--s1);animation:dlfd .12s}.dr.r .drm{left:auto;right:0}
.drm button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border-radius:11px;font-weight:600;font-size:13px}.drm button:hover{background:var(--s2)}.drm button.on{color:var(--at);background:var(--as)}.drm .lb{padding:8px 12px 4px}
.dbg{position:fixed;inset:0;z-index:65}
.acts{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap}.acts .bt{min-width:124px}
.tbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.tbar .fl{min-width:0}
/* wallet */
.wlt{position:relative;overflow:hidden;isolation:isolate;border:1px solid var(--ab);border-radius:24px;padding:20px 20px 16px;background:radial-gradient(120% 100% at 100% 0%,var(--as),transparent 58%),linear-gradient(158deg,var(--s2) 0%,var(--s1) 62%);animation:dlfd .35s backwards}
.wlt::before{content:"";position:absolute;inset:0;z-index:-1;background:repeating-radial-gradient(circle at 100% 0,transparent 0 17px,var(--as) 17px 18px);-webkit-mask-image:radial-gradient(90% 90% at 100% 0,#000,transparent 72%);mask-image:radial-gradient(90% 90% at 100% 0,#000,transparent 72%);opacity:.9}
.wlt::after{content:"";position:absolute;inset:5px;z-index:-1;border:1px solid var(--bd);border-radius:19px;opacity:.55;pointer-events:none}
.wlt .wh{display:flex;align-items:center;gap:10px}.wlt .wchip{flex:none;width:36px;height:26px;border-radius:7px;border:1px solid var(--ab);background:linear-gradient(90deg,transparent 31%,var(--ab) 31% 33%,transparent 33% 66%,var(--ab) 66% 68%,transparent 68%),linear-gradient(0deg,transparent 45%,var(--ab) 45% 55%,transparent 55%),var(--as)}
.wlt .wl{flex:1;min-width:0;font:600 10.5px/1.2 'DM Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wlt .wey{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--bd);background:var(--s1);color:var(--mu);display:grid;place-items:center;cursor:pointer;transition:border-color .2s,color .2s}.wlt .wey:hover{border-color:var(--bh);color:var(--tx)}
.wlt .wb{margin:16px 0 2px;display:flex;align-items:baseline;gap:6px;min-width:0}.wlt .wb b{font:500 clamp(34px,9.5vw,48px)/1.05 'Fraunces',Georgia,serif;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}.wlt .wb i{font:500 clamp(18px,5vw,24px)/1 'Fraunces',Georgia,serif;font-style:normal;color:var(--at)}
.wlt .wm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:24px}.wlt .wsp{display:block;width:100%;height:38px;margin:12px 0 4px}
.wlt .wid{font:12px/1 'DM Mono',ui-monospace,monospace;letter-spacing:.12em;color:var(--mu)}
.wlt .wact{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.wlt .wft{display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--bd);color:var(--mu);font-size:12px}
.wlt.ok{border-color:var(--bd)}
.txg{display:flex;flex-direction:column}.txg .lb{margin:14px 0 2px}.txg .lb:first-child{margin-top:4px}
.tx{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--bd);min-width:0}.tx:last-child{border-bottom:0}.tx .em{flex:none}
.tx .ta{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:700}.tx .ta.cr{color:var(--at)}
.wlk{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.wlk>div{border:1px solid var(--bd);border-radius:14px;padding:12px;background:var(--s1);min-width:0}.wlk b{display:block;font-size:17px;font-variant-numeric:tabular-nums}
/* compact rhythm: tighter spacing, same detail */
.col{gap:10px}.hdr{margin-bottom:12px}.cd{padding:14px}.sd .cd{padding:12px}.sd{gap:10px}
.rk{padding:8px 0;gap:10px}.em.sm{width:38px;height:38px;font-size:19px;border-radius:12px}
.kp{gap:6px}.kp>div{padding:9px 6px;border-radius:12px}.ct2{padding:8px 10px;border-radius:14px}.setrow{padding:12px 14px;border-radius:16px}
.cd>.lb+*{margin-top:6px}.chip,.ch{padding:2px 9px}
.wlt{padding:14px 16px 12px;border-radius:22px}.wlt::after{inset:4px;border-radius:18px}
.wlt .wb{margin:10px 0 0}.wlt .wb b{font-size:clamp(32px,9vw,42px)}.wlt .wm{min-height:22px;margin-top:4px}.wlt .wsp{height:30px;margin:8px 0 2px}
.wlt .wact{margin-top:10px}.wlt .wft{margin-top:10px;padding-top:9px;font-size:11.5px}.wlt .wey{width:30px;height:30px}.wlt .wchip{width:32px;height:23px}
.txg .lb{margin:10px 0 0;padding:0 0 3px;font-size:10px}.tx{padding:7px 0;gap:10px}.tx .em{width:32px!important;height:32px!important;border-radius:10px}.tx .em svg{width:15px;height:15px}
.tx .b{font-size:13.5px;line-height:1.3}.tx .xs{font-size:11.5px;line-height:1.3}.tx .ta{font-size:13.5px}
.cd>.txg{margin-top:2px}
.sg2{display:inline-flex;padding:3px;border:1px solid var(--bd);border-radius:999px;background:var(--s1);align-self:flex-start}.sg2 button{height:32px;padding:0 14px;border-radius:999px;color:var(--mu);font-weight:600;font-size:13px;transition:background .2s,color .2s}.sg2 button.on{background:var(--as);color:var(--at);box-shadow:inset 0 0 0 1px var(--ab)}
.pf .t span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px}.pf .t b{max-width:210px}@media(max-width:520px){.tsrch{flex:1 1 100%!important}}
/* overlays: everything renders through a portal so nothing can trap it */
.bd{position:fixed;inset:0;z-index:333;background:var(--ov);animation:dlfd .2s}
.sh{position:fixed;z-index:336;left:0;right:0;margin:0 auto;bottom:0;width:min(520px,100%);display:flex;flex-direction:column;background:var(--s1);border:1px solid var(--bd);border-bottom:0;border-radius:24px 24px 0 0;animation:dlup .28s cubic-bezier(.2,.9,.3,1);overflow:hidden;max-height:88vh}
.sh .hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd)}.sh .bdy{flex:1;overflow-y:auto;padding:14px 16px calc(22px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;scrollbar-width:none}
.fs{position:fixed;inset:0;z-index:330;height:100vh;height:100dvh;display:flex;flex-direction:column;background:var(--bg);animation:dlsl .26s cubic-bezier(.2,.9,.3,1)}.fs.up{z-index:340}.fs.top{z-index:350}
.fs>.hd{flex:none;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) max(14px,calc((100% - 760px)/2)) 10px;border-bottom:1px solid var(--bd);background:var(--bg)}
.fs>.bdy{flex:1;overflow-y:auto;padding:16px max(14px,calc((100% - 760px)/2));display:flex;flex-direction:column;gap:12px;scrollbar-width:none;overscroll-behavior:contain}
.fs>.pt,.fs>.qr{flex:none;padding-inline:max(12px,calc((100% - 760px)/2))}.fs>.cb{flex:none;padding-inline:max(12px,calc((100% - 760px)/2));border-top:1px solid var(--bd)}.fs>.ro{flex:none;margin:12px max(12px,calc((100% - 760px)/2)) calc(12px + env(safe-area-inset-bottom))}
.fb{flex:none;padding:12px max(14px,calc((100% - 760px)/2)) calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--bd);background:var(--bg)}
@media(min-width:700px){.fs.dlg{inset:0;margin:auto;width:min(640px,92vw);height:min(780px,90vh);border-radius:22px;border:1px solid var(--bd);overflow:hidden;animation:dlfd .2s}.fs.dlg>.hd{padding-inline:20px}.fs.dlg>.bdy{padding-inline:20px}.fs.dlg .fb{padding-inline:20px}}
.pt{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none}.pt button{display:flex;align-items:center;gap:7px;height:34px;padding:0 12px 0 5px;border-radius:999px;border:1px solid var(--bd);font-size:12.5px;font-weight:600;color:var(--mu);white-space:nowrap}.pt button.on{color:var(--at);border-color:var(--ac);background:var(--as)}
.mg{max-width:80%;padding:9px 13px;border-radius:18px 18px 18px 6px;background:var(--bub);overflow-wrap:anywhere;animation:dlpop .2s}.mg.me{align-self:flex-end;border-radius:18px 18px 6px 18px;background:var(--ag);color:var(--acx)}.mg small{display:block;font-size:10px;opacity:.6;margin-top:2px}
.sy{align-self:center;font-size:11px;color:var(--mu);padding:3px 10px;border:1px dashed var(--bh);border-radius:99px;text-align:center}
.ty{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;border-radius:18px;background:var(--bub)}.ty i{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:dlbl 1s infinite}.ty i:nth-child(2){animation-delay:.15s}.ty i:nth-child(3){animation-delay:.3s}
.qr{display:flex;gap:8px;overflow-x:auto;padding:10px 12px 12px;scrollbar-width:none}.qr button{flex:none;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--ab);background:var(--as);color:var(--at);font-size:12.5px;font-weight:600}
.cb{display:flex;align-items:center;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom))}
.cb input,.in{min-width:0;background:var(--s1);border:1px solid var(--bd);color:var(--tx);outline:none}.cb input{flex:1;height:44px;border-radius:999px;padding:0 16px}.in{width:100%;height:46px;border-radius:14px;padding:0 14px}.cb input:focus,.in:focus{border-color:var(--ac)}select.in{appearance:none}
.cl{position:fixed;inset:0;z-index:400;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:calc(60px + env(safe-area-inset-top)) 24px calc(40px + env(safe-area-inset-bottom));background:var(--bg);animation:dlfd .25s}
.rg{position:relative;display:grid;place-items:center;margin:20px 0 14px}.rg:before,.rg:after{content:"";position:absolute;inset:-14px;border-radius:50%;border:1px solid var(--ac);animation:dlpl 2s infinite}.rg:after{animation-delay:1s}.cl.on .rg:before,.cl.on .rg:after{animation:none;opacity:.3}
.ct{display:flex;gap:18px;align-items:center}.ct button{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--s2);border:1px solid var(--bh);transition:.15s}.ct button.on{background:var(--tx);color:var(--bg)}.ct button.end{width:70px;height:70px;background:#e11d48;border-color:#e11d48;color:#fff}.ct button.ok{width:70px;height:70px;background:var(--ag);border-color:var(--ac);color:var(--acx)}
.pl{display:flex;align-items:center;gap:8px;padding:12px 14px;border:1px solid var(--ab);border-radius:14px;background:var(--as);font-size:12px;color:var(--tx)}.pl.w{border-color:transparent;background:var(--wns);color:var(--wrn)}
.ct2{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--bd);border-radius:16px;background:var(--s1);width:100%}.ct2.on{border-color:var(--ac);background:var(--as)}
.toast{position:fixed;bottom:96px;left:50%;transform:translateX(-50%);z-index:500;background:var(--tx);color:var(--bg);padding:10px 18px;border-radius:99px;font-weight:600;font-size:13px;white-space:nowrap;animation:dlfd .2s}
@media(max-width:699px){.sh{width:100%}.toast{bottom:calc(92px + env(safe-area-inset-bottom))}}
.tgl{position:relative;width:52px;height:30px;border-radius:99px;background:var(--s3);border:1px solid var(--bh);flex:none;transition:background .2s,border-color .2s}.tgl:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:var(--s1);border:1px solid var(--bh);transition:left .2s}.tgl.on{background:var(--ag);border-color:var(--ac)}.tgl.on:after{left:25px;border-color:var(--ac)}.tgl.big{width:60px;height:34px}.tgl.big:after{width:26px;height:26px}.tgl.big.on:after{left:29px}
.seg{display:flex;gap:4px;padding:4px;border:1px solid var(--bd);border-radius:999px;background:var(--s1)}.seg button{flex:1;height:34px;border-radius:999px;font-size:12.5px;font-weight:700;color:var(--mu);text-align:center;transition:.2s;display:flex;align-items:center;justify-content:center;gap:6px}.seg button.on{background:var(--ag);color:var(--acx)}
.pn{display:flex;align-items:center;gap:8px}.pn .ib{width:36px;height:36px}
.dt{display:flex;gap:8px}.dt label{flex:1;display:flex;flex-direction:column;gap:4px}.dt input{height:42px;background:var(--s1);border:1px solid var(--bd);border-radius:12px;padding:0 10px;color:var(--tx);outline:none}.dt input:focus{border-color:var(--ac)}
.chart{display:flex;align-items:flex-end;gap:3px;height:150px;margin-top:14px}.chart button{flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}.chart i{display:block;width:100%;border-radius:6px 6px 2px 2px;background:var(--ab);opacity:.6;min-height:3px;transition:height .4s}.chart button.top i{background:var(--ag);opacity:1}.chart button.sel i{background:var(--tx);opacity:1}.chart span{font-size:9.5px;color:var(--mu);height:12px;white-space:nowrap;overflow:visible}
.stp{display:flex;align-items:center;gap:8px}.stp button{width:32px;height:32px;border-radius:50%;border:1px solid var(--bh);display:grid;place-items:center;background:var(--s2)}.stp button.p{background:var(--ag);color:var(--acx);border-color:var(--ac)}
.pin4{display:flex;gap:8px;justify-content:center;margin:10px 0}.pin4 input{width:54px;height:62px;text-align:center;font-size:26px;font-weight:800;background:var(--s1);border:1px solid var(--bd);border-radius:14px;color:var(--tx);outline:none}.pin4 input:focus{border-color:var(--ac)}
.opt{display:flex;flex-direction:column;gap:8px}.opt button{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:14px;border:1px solid var(--bd);font-weight:600;background:var(--s1)}.opt button.on{border-color:var(--ac);color:var(--at);background:var(--as)}
.setrow{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border:1px solid var(--bd);border-radius:18px;background:var(--s1);font-weight:700;transition:border-color .15s}.setrow:hover{border-color:var(--ab)}
.sw-r{display:flex;align-items:center;gap:10px;padding:8px 0}
@keyframes dlfd{from{opacity:0}}@keyframes dlup{from{transform:translateY(100%)}}@keyframes dlsl{from{opacity:0;transform:translateY(24px)}}@keyframes dlpop{from{opacity:0;transform:translateY(6px) scale(.97)}}/* notifications: full height on phones, taller and wider sheet on tablets, right drawer (30%) on desktop */
@keyframes dlsr{from{transform:translateX(100%)}}
@media(max-width:699px){.sh.nt{top:0;width:100%;max-height:none;height:100vh;height:100dvh;border:0;border-radius:0}.sh.nt .hd{padding-top:calc(14px + env(safe-area-inset-top))}}
@media(min-width:700px) and (max-width:1023px){.sh.nt{width:min(700px,92vw);max-height:none;height:min(88dvh,900px)}}
@media(min-width:1024px){.sh.nt{left:auto;right:0;top:0;bottom:0;margin:0;width:30vw;min-width:380px;max-width:560px;max-height:none;height:100dvh;border:0;border-left:1px solid var(--bd);border-radius:0;animation:dlsr .3s cubic-bezier(.2,.9,.3,1)}}
/* messages on desktop: conversation list left, chat (or the brand empty state) right */
.ct2.on{border-color:var(--ab);background:var(--as)}.lg.big{width:72px;height:80px;font-size:30px}
.ms{display:flex;align-items:center;gap:8px;margin:10px 12px 0;height:40px;padding:0 14px;border:1px solid var(--bd);border-radius:999px;background:var(--s1)}.ms input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--tx)}
@media(min-width:1000px){
.fs.msg{inset:0;margin:auto;width:min(1120px,94vw);height:min(780px,90vh);flex-direction:row;border-radius:22px;border:1px solid var(--bd);overflow:hidden;animation:dlfd .2s;background:var(--bg)}
.fs.msg .ml{width:340px;flex:none;display:flex;flex-direction:column;min-width:0;border-right:1px solid var(--bd);background:var(--s1)}
.fs.msg .th{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg)}
.th.emp{align-items:center;justify-content:center;gap:10px;padding:24px;background:radial-gradient(60% 50% at 50% 42%,var(--as),transparent 70%),var(--bg)!important}
.th>.hd,.ml>.hd{flex:none;display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid var(--bd);background:var(--bg)}.ml>.hd{background:var(--s1)}.th>.hd .fl{min-width:0}
.th>.bdy,.ml>.bdy{flex:1;min-height:0;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none;overscroll-behavior:contain}.ml>.bdy{padding:10px 12px 16px;gap:8px}
.th>.pt,.th>.qr{flex:none;padding-inline:16px}.th>.cb{flex:none;padding-inline:16px;border-top:1px solid var(--bd)}.th>.ro{flex:none;margin:12px 16px}
.th .mg{max-width:68%}
.fs.top.tdlg{inset:0;margin:auto;width:min(760px,92vw);height:min(800px,90vh);border-radius:22px;border:1px solid var(--bd);overflow:hidden;animation:dlfd .2s}}
@keyframes dlbl{50%{opacity:.3}}@keyframes dlpl{from{opacity:.7;transform:scale(.9)}to{opacity:0;transform:scale(1.5)}}
@media(prefers-reduced-motion:reduce){.dl *,.dlp *{animation:none!important;transition:none!important}}
`;
const cn = (...a) => a.filter(Boolean).join(" ");
const ThemeCtx = createContext("");
function useThemeState() {
  const [theme, setT] = useState("dark"), [sys, setSys] = useState(false), [sw, setSw] = useState(false);
  useEffect(() => { const m = window.matchMedia("(prefers-color-scheme: light)"); setSys(m.matches); const f = (e) => setSys(e.matches); m.addEventListener && m.addEventListener("change", f); return () => m.removeEventListener && m.removeEventListener("change", f); }, []);
  const light = theme === "light" || (theme === "auto" && sys);
  const setTheme = (v) => { if (v === theme) return; setSw(true); setT(v); setTimeout(() => setSw(false), 600); };
  useEffect(() => { try { const bg = light ? "#f5f5f8" : "#050506", h = document.documentElement; h.style.transition = "background-color .45s ease"; h.style.backgroundColor = bg; document.body.style.backgroundColor = bg; h.style.colorScheme = light ? "light" : "dark"; } catch (e) { /* ignore */ } }, [light]);
  return { theme, setTheme, cls: cn(light && "lt", sw && "sw") };
}
function Portal({ children }) { const c = useContext(ThemeCtx); return <div className={cn("dlp", c)}>{children}</div>; }
const STK = [];
let LOCK = 0, PREV = "";
function useModal(onClose) {
  useEffect(() => { const id = {}; STK.push(id); const k = (e) => e.key === "Escape" && STK[STK.length - 1] === id && onClose(); document.addEventListener("keydown", k); if (LOCK++ === 0) { PREV = document.body.style.overflow; document.body.style.overflow = "hidden"; } return () => { document.removeEventListener("keydown", k); if (--LOCK <= 0) { LOCK = 0; document.body.style.overflow = PREV; } STK.splice(STK.indexOf(id), 1); }; }, []); // eslint-disable-line
}
function useToast() { const [t, s] = useState(""); useEffect(() => { if (!t) return; const x = setTimeout(() => s(""), 2200); return () => clearTimeout(x); }, [t]); return [t, s]; }
const Toast = ({ t }) => (t ? <Portal><div className="toast" role="status">{t}</div></Portal> : null);
function Av({ id, s = 40, on }) { const profile = useAuthenticatedProfile(); const p = id === "me" && profile ? { ...PPL.me, n: profile.display_name } : PPL[id]; return <span className="av" style={{ "--s": s + "px", "--g1": p.g[0], "--g2": p.g[1], overflow: "hidden" }}>{id === "me" && profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.n[0]}{on && <i />}</span>; }
const Tgl = ({ on, set, label, big, disabled }) => <button className={cn("tgl", big && "big", on && "on")} role="switch" aria-checked={!!on} aria-label={label} onClick={set} disabled={disabled} />;
const Rw = ({ t, d, children }) => <div className="rk"><div className="fl"><div className="b">{t}</div>{d && <div className="xs mu">{d}</div>}</div>{children}</div>;
function ThemeSwitch({ th }) { return <div className="seg" role="radiogroup" aria-label="Theme">{[["dark", "Dark", Moon], ["light", "Light", Sun], ["auto", "Auto", Monitor]].map(([k, l, I]) => <button key={k} role="radio" aria-checked={th.theme === k} className={th.theme === k ? "on" : ""} onClick={() => th.setTheme(k)}><I size={14} />{l}</button>)}</div>; }
const SW = ({ title, children, act }) => <div className="cd"><div className="row" style={{ marginBottom: 8 }}><span className="lb fl">{title}</span>{act}</div>{children}</div>;

/* ═════════ Call · Chat · Inbox ═════════ */
function Call({ peer, incoming, onEnd, onChat, note }) {
  useModal(() => {});
  const [t, setT] = useState(incoming ? -2 : -1), [mute, setMute] = useState(false), [spk, setSpk] = useState(false);
  useEffect(() => { if (t !== -1) return; const x = setTimeout(() => setT(0), 1800); return () => clearTimeout(x); }, [t]);
  useEffect(() => { if (t < 0) return; const i = setInterval(() => setT((v) => v + 1), 1000); return () => clearInterval(i); }, [t < 0]); // eslint-disable-line
  const live = t >= 0, mm = String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  return <Portal><div className={cn("cl", live && "on")} role="dialog" aria-label={"Call with " + PPL[peer].n}>
    <div style={{ textAlign: "center" }}><div className="lb">{live ? "In-app call" : t === -2 ? "Incoming in-app call" : "Calling…"}</div><div className="rg"><Av id={peer} s={108} /></div>
      <h2 style={{ fontSize: 24 }}>{PPL[peer].n}</h2><div className={cn("mono", live ? "ac" : "mu")} style={{ marginTop: 4 }}>{live ? mm : PPL[peer].r + (t === -2 ? " · calling you" : " · ringing")}</div></div>
    <div className="col" style={{ width: "min(360px,100%)", alignItems: "center", gap: 28 }}>
      <div className="pl"><ShieldCheck size={16} className="ac" />{note || "Free in-app call. No airtime used and phone numbers stay private."}</div>
      {t === -2 ? <div className="ct"><button className="end" aria-label="Decline" onClick={() => onEnd(0)}><PhoneOff size={26} /></button><button className="ok" aria-label="Accept" onClick={() => setT(0)}><Phone size={26} /></button></div>
        : <div className="ct"><button className={mute ? "on" : ""} aria-label="Mute" onClick={() => setMute(!mute)}>{mute ? <MicOff size={22} /> : <Mic size={22} />}</button><button className="end" aria-label="End call" onClick={() => onEnd(live ? t : 0)}><PhoneOff size={26} /></button><button className={spk ? "on" : ""} aria-label="Speaker" onClick={() => setSpk(!spk)}><Volume2 size={22} /></button></div>}
      {t !== -2 && <button className="bt s" onClick={onChat}><MessageCircle size={14} />Switch to chat</button>}</div></div></Portal>;
}
/* Thread: always a full-screen layer above everything (nav included), same as a call. */
function Thread({ peers, start, onCall, onClose, order, orderId, canWrite = true, canCall = true, onSend, joinable, inline, onEsc }) {
  useModal(inline ? (onEsc || (() => {})) : onClose);
  const canSend = canWrite && Boolean(orderId);
  const [cur, setCur] = useState(start), [log, setLog] = useState(() => Object.fromEntries(peers.map((p) => [p, []]))), [ty, setTy] = useState(false), [v, setV] = useState(""), [joined, setJoined] = useState(false), [error, setError] = useState(""), end = useRef(null);
  useEffect(() => { setCur(start); }, [start]);
  useEffect(() => {
    if (!orderId || !supabase) return;
    let active = true;
    const refresh = async () => {
      try {
        const [messages, { data: { user } }] = await Promise.all([listOrderMessages(orderId), supabase.auth.getUser()]);
        if (!active || !user) return;
        setLog({ [cur]: messages.map((message) => ({ me: message.sender_id === user.id, x: message.body, t: new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) })) });
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load order messages.");
      }
    };
    const channel = subscribeToOrderMessages(orderId, () => void refresh());
    void refresh();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [orderId, cur]); // eslint-disable-line
  useEffect(() => { end.current && end.current.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [log, ty, cur]);
  const send = async (x) => {
    x = x.trim(); if (!x || !canSend) return; setV(""); setError("");
    try { await sendOrderMessage(orderId, x); onSend && onSend(cur); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send this message."); }
  };
  const join = () => { setJoined(true); setLog((l) => ({ ...l, [cur]: [...(l[cur] || []), { sys: 1, x: "Support joined this conversation" }] })); onSend && onSend(cur, "join"); };
  const body = <>
    <div className="hd"><Av id={cur} s={42} on /><div className="fl"><div className="b tr">{PPL[cur].n}</div><div className="xs ac">{PPL[cur].r}{canSend ? " · order chat" : " · unavailable"}</div></div>
      <button className="ib g" aria-label="Call" disabled={!canCall} onClick={() => onCall(cur)}>{canCall ? <Phone size={18} /> : <Lock size={15} />}</button>{!inline && <button className="ib" aria-label="Close chat" onClick={onClose}><X size={18} /></button>}</div>
    {!inline && peers.length > 1 && <div className="pt">{peers.map((p) => <button key={p} className={cur === p ? "on" : ""} onClick={() => setCur(p)}><Av id={p} s={24} />{PPL[p].r}</button>)}</div>}
    <div className="bdy" style={{ gap: 8 }}><div className="sy">{order ? order + " · " : ""}{canSend ? "order conversation" : "Support chat is not connected."}</div>
      {(log[cur] || []).map((m, i) => m.sys ? <div key={i} className="sy">{m.x}</div> : <div key={i} className={cn("mg", m.me && "me")}>{m.x}<small>{m.t}{m.me ? " · ✓✓" : ""}</small></div>)}{ty && <div className="ty"><i /><i /><i /></div>}{error && <p className="xs" role="alert">{error}</p>}<div ref={end} /></div>
    {!canSend ? <div className="pl w ro"><Lock size={15} />Only order-linked messages are currently stored. General support messaging is unavailable.</div> : <>
      {joinable && !joined && <div style={{ padding: "8px max(12px,calc((100% - 760px)/2)) 0", flex: "none" }}><button className="bt s w" onClick={join}><Radio size={13} />Join conversation (they will see "Support joined")</button></div>}
      <div className="qr">{(QR[PPL[cur].r] || []).map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}<button onClick={() => send("📍 Shared my live location")}><Navigation size={12} style={{ verticalAlign: -2 }} /> Share location</button></div>
      <div className="cb"><input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(v)} placeholder={"Message " + PPL[cur].n.split(" ")[0] + "…"} aria-label="Message" /><button className="ib g" aria-label="Send" onClick={() => send(v)}><Send size={17} /></button></div></>}
  </>;
  return inline ? <section className="th" aria-label={"Chat with " + PPL[cur].n}>{body}</section> : <Portal><div className="bd tbd" style={{ zIndex: 325 }} onClick={onClose} /><div className="fs top tdlg" role="dialog" aria-modal="true" aria-label="Chat">{body}</div></Portal>;
}
/* Comms: header Messages (inbox of conversations) and Support (opens the support thread straight away). */
function useWide(px) {
  const q = "(min-width:" + px + "px)", [w, setW] = useState(() => typeof matchMedia !== "undefined" && matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q), f = () => setW(m.matches); m.addEventListener("change", f); f(); return () => m.removeEventListener("change", f); }, []); // eslint-disable-line
  return w;
}
function Comms({ mode, convs, onClose, say, order, thread = {} }) {
  const [chat, setChat] = useState(mode === "support" ? "sup" : null), [call, setCall] = useState(null), [sq, setSq] = useState(""), wide = useWide(1000);
  const peers = mode === "support" ? ["sup"] : convs.map((c) => c.p), split = mode === "inbox" && wide;
  useModal(onClose);
  const shown = convs.filter((c) => !sq.trim() || PPL[c.p].n.toLowerCase().includes(sq.trim().toLowerCase()) || PPL[c.p].r.toLowerCase().includes(sq.trim().toLowerCase()));
  const list = <>{shown.map((c) => <button key={c.p} className={cn("ct2", split && chat === c.p && "on")} style={{ padding: 12 }} onClick={() => setChat(c.p)}><Av id={c.p} s={44} on /><div className="fl"><div className="row"><span className="b tr fl">{PPL[c.p].n}</span><span className="xs mu">{c.t}</span></div><div className="xs mu tr">{PPL[c.p].r} · {c.last}</div></div>{c.un ? <span className="ch g">{c.un} new</span> : null}</button>)}
    {!shown.length && <div className="cd mu" style={{ textAlign: "center" }}>{convs.length ? "Nobody matches." : "No conversations yet."}</div>}<p className="xs mu" style={{ textAlign: "center" }}>Chats and calls are free and keep phone numbers private.</p></>;
  return <>{mode === "inbox" && !split && <Portal><div className="fs" role="dialog" aria-modal="true" aria-label="Messages">
    <div className="hd"><h3 className="fl serif" style={{ fontSize: 20 }}>Messages</h3><button className="ib" aria-label="Close messages" onClick={onClose}><X size={18} /></button></div>
    <div className="bdy">{list}</div></div></Portal>}
    {split && <Portal><div className="bd" style={{ zIndex: 325 }} onClick={onClose} /><div className="fs msg" role="dialog" aria-modal="true" aria-label="Messages">
      <aside className="ml"><div className="hd"><h3 className="fl serif" style={{ fontSize: 20 }}>Messages</h3><button className="ib" aria-label="Close messages" onClick={onClose}><X size={18} /></button></div>
        <label className="ms"><Search size={15} className="mu" /><input value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Search conversations" aria-label="Search conversations" /></label>
        <div className="bdy">{list}</div></aside>
      {chat ? <Thread inline order={order} peers={peers} start={chat} {...thread} onEsc={onClose} onCall={(p) => setCall(p)} onClose={() => setChat(null)} />
        : <section className="th emp" aria-label="No conversation selected"><span className="lg big">D</span><h2 className="serif" style={{ fontSize: 26, marginTop: 18 }}>Dispatch Messages</h2><p className="mu" style={{ maxWidth: 320, textAlign: "center" }}>Select a conversation on the left to start chatting.</p><div className="ch"><ShieldCheck size={12} />Free in-app chats and calls · phone numbers stay private</div></section>}
    </div></Portal>}
    {!split && chat && <Thread order={order} peers={peers} start={chat} {...thread} onCall={(p) => { setChat(null); setCall(p); }} onClose={() => (mode === "support" ? onClose() : setChat(null))} />}
    {call && <Call peer={call} onChat={() => { setChat(call); setCall(null); }} onEnd={(s) => { setCall(null); say(s ? "Call ended · " + s + "s, free" : "Call cancelled"); if (mode === "support") onClose(); }} />}</>;
}
function ContactBar({ peers, say, order, orderId, ring, clearRing, thread = {} }) {
  const [chat, setChat] = useState(null), [call, setCall] = useState(null), [un, setUn] = useState({ [peers[0]]: 1 });
  useEffect(() => { if (ring) { setCall({ p: ring, inc: true }); clearRing(); } }, [ring]); // eslint-disable-line
  const cw = thread.canWrite !== false, cc = thread.canCall !== false;
  return <><div className="col" style={{ gap: 8 }}>{peers.map((p) => <div key={p} className="ct2"><Av id={p} s={38} on /><div className="fl"><div className="b tr" style={{ fontSize: 13 }}>{PPL[p].n}</div><div className="xs mu">{PPL[p].r}</div></div>
    <button className="ib" aria-label={"Chat with " + PPL[p].n} onClick={() => { setChat(p); setUn({ ...un, [p]: 0 }); }}>{cw ? <MessageCircle size={18} /> : <Eye size={18} />}{un[p] ? <span className="bdg">{un[p]}</span> : null}</button>
    <button className="ib g" aria-label={"Call " + PPL[p].n} disabled={!cc} onClick={() => setCall({ p })}>{cc ? <Phone size={18} /> : <Lock size={15} />}</button></div>)}</div>
    {chat && <Thread order={order} orderId={orderId} peers={peers} start={chat} {...thread} onCall={(p) => { setChat(null); setCall({ p }); }} onClose={() => setChat(null)} />}
    {call && <Call peer={call.p} incoming={call.inc} onChat={() => { setChat(call.p); setCall(null); }} onEnd={(s) => { setCall(null); if (thread.onCallEnd) thread.onCallEnd(call.p, s); say(s ? "Call ended · " + s + "s, free" : call.inc ? "Call declined" : "Call cancelled"); }} />}</>;
}
/* Drop: a compact dropdown. options = [[key, emoji, name], ...] */
function Drop({ label, value, options, onPick, right, head, placeholder }) {
  const [o, setO] = useState(false), cur = options.find((x) => x[0] === value) || (placeholder ? ["", "", placeholder] : options[0]);
  return <div className={cn("dr", right && "r")}><button className={cn("drb", o && "on")} aria-haspopup="listbox" aria-expanded={o} onClick={() => setO(!o)}>{label && <span className="mu">{label}</span>}{cur[1] ? <span>{cur[1]}</span> : null}<b>{cur[2]}</b><ChevronDown size={14} /></button>
    {o && <><div className="dbg" onClick={() => setO(false)} /><div className="drm" role="listbox">{head && <div className="lb">{head}</div>}{options.map(([k, e, n, d]) => <button key={k} role="option" aria-selected={k === value} className={k === value ? "on" : ""} onClick={() => { setO(false); onPick(k); }}>{e ? <span style={{ fontSize: 17 }}>{e}</span> : null}<span className="fl" style={{ textAlign: "left" }}>{n}{d ? <span className="xs mu" style={{ display: "block", fontWeight: 500 }}>{d}</span> : null}</span>{k === value && <Check size={15} />}</button>)}</div></>}</div>;
}
function Sheet({ title, onClose, children, kind }) {
  useModal(onClose);
  return <Portal><div className="bd" onClick={onClose} /><div className={cn("sh", kind)} role="dialog" aria-label={title}><div className="hd"><h3 className="fl" style={{ fontSize: 17 }}>{title}</h3><button className="ib" aria-label="Close" onClick={onClose}><X size={18} /></button></div><div className="bdy">{children}</div></div></Portal>;
}

/* WalletCard: the shared premium balance card. amount is a formatted string; spark is a list of recent values. */
function WalletCard({ label, badge, amount, id, delta, spark, sparkLabel, actions, foot, note, hideable = true }) {
  const [hid, setHid] = useState(false);
  const mt = String(amount).match(/^(\D*)(.*)$/), sym = mt[1], num = mt[2];
  let path = "", area = "";
  if (spark && spark.length > 1) {
    const mx = Math.max(...spark), mn = Math.min(...spark), r = mx - mn || 1, st = 120 / (spark.length - 1);
    const pts = spark.map((v, i) => [i * st, 32 - ((v - mn) / r) * 26 - 3]);
    path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    area = path + " L120 36 L0 36 Z";
  }
  const gid = "g" + String(label).replace(/\W/g, "");
  return <div className="wlt">
    <div className="wh"><span className="wchip" aria-hidden="true" /><span className="wl">{label}</span>{badge}
      {hideable && <button className="wey" aria-label={hid ? "Show balance" : "Hide balance"} aria-pressed={hid} onClick={() => setHid(!hid)}>{hid ? <EyeOff size={15} /> : <Eye size={15} />}</button>}</div>
    <div className="wb">{sym && <i>{sym}</i>}<b>{hid ? "••••••" : num}</b></div>
    <div className="wm">{delta && !hid && <span className="ch g"><ArrowUpRight size={11} />{delta}</span>}{id && <span className="wid">{id}</span>}{note && <span className="xs mu">{note}</span>}</div>
    {path && !hid && <svg className="wsp" viewBox="0 0 120 36" preserveAspectRatio="none" role="img" aria-label={sparkLabel || "Recent activity"}><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity=".28" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs><path d={area} fill={"url(#" + gid + ")"} /><path d={path} fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>}
    {actions && <div className="wact">{actions.map((a) => <button key={a.l} className={cn("bt", a.p && "p")} disabled={a.d} onClick={a.on}>{a.I && <a.I size={15} />}{a.l}</button>)}</div>}
    {foot && <div className="wft"><ShieldCheck size={14} className="ac" /><span className="fl">{foot}</span></div>}
  </div>;
}
/* TxList: grouped activity. rows = [{d:"in"|"out", t, s, a, g}] where g is the group heading. */
function TxList({ rows, empty = "Nothing here yet.", icon }) {
  if (!rows.length) return <p className="mu" style={{ marginTop: 10 }}>{empty}</p>;
  let last = null;
  return <div className="txg">{rows.map((r, i) => { const h = r.g !== last; last = r.g; const In = r.d === "in", I = icon || (In ? ArrowDownLeft : ArrowUpRight);
    return <Fragment key={i}>{h && <div className="lb">{r.g}</div>}<div className="tx"><span className="em sm" style={{ width: 38, height: 38, background: In ? "var(--as)" : "var(--dgs)", color: In ? "var(--at)" : "var(--dng)" }}><I size={17} /></span><div className="fl"><div className="b tr">{r.t}</div>{r.s && <div className="xs mu tr">{r.s}</div>}</div><span className={cn("ta", In && "cr")}>{In ? "+" : "−"}{r.a}</span></div></Fragment>; })}</div>;
}
function SignOut({ say, who }) {
  const [o, setO] = useState(false);
  return <><div className="sgn"><button className="so" onClick={() => setO(true)}><LogOut size={16} />Sign out</button>{who && <span className="xs mu">Signed in as {who}</span>}</div>
    {o && <Sheet title="Sign out of Dispatch?" onClose={() => setO(false)}><p className="mu">You will need to sign in again to see your account. Nothing is lost.</p><div className="row" style={{ justifyContent: "flex-end", marginTop: 6 }}><button className="bt o" onClick={() => setO(false)}>Stay signed in</button><button className="bt r" onClick={() => { setO(false); say("Signed out (demo)"); }}><LogOut size={14} />Sign out</button></div></Sheet>}</>;
}
const BANKS = ["Access Bank", "GTBank", "First Bank", "UBA", "Zenith Bank", "Kuda", "Opay", "Moniepoint", "PalmPay", "Wema Bank", "Fidelity Bank", "Sterling Bank", "Stanbic IBTC", "Union Bank", "FCMB"];
/* Payouts: manage where money is paid. Every change is confirmed with the 4-digit PIN (demo 1234). */
function Payouts({ holder, accounts, setAccounts, say, onClose, sched, onLog }) {
  const [view, setView] = useState("list"), [bank, setBank] = useState("GTBank"), [num, setNum] = useState(""), [pn, setPn] = useState(["", "", "", ""]), [pend, setPend] = useState(null), refs = useRef([]);
  const ok = num.length === 10, log = (m) => onLog && onLog(m);
  const typeP = (i, v) => { if (!/^\d?$/.test(v)) return; const n = [...pn]; n[i] = v; setPn(n); if (v && i < 3 && refs.current[i + 1]) refs.current[i + 1].focus(); };
  const gate = (label, fn) => { setPend({ label, fn }); setPn(["", "", "", ""]); setView("pin"); };
  const confirm = () => { if (pn.join("") !== "1234") { say("Wrong PIN · try again"); setPn(["", "", "", ""]); refs.current[0] && refs.current[0].focus(); return; } pend.fn(); setPend(null); setView("list"); };
  const add = () => { const id = "a" + Date.now(); setAccounts((l) => [...l, { id, bank, last: num.slice(-4), name: holder.toUpperCase(), def: l.length === 0 }]); log("Added payout account " + bank + " ···· " + num.slice(-4)); say(bank + " ···· " + num.slice(-4) + " added · ready in 24 hours"); setNum(""); };
  const mkDef = (a) => gate("Make " + a.bank + " the default", () => { setAccounts((l) => l.map((x) => ({ ...x, def: x.id === a.id }))); log("Set default payout account " + a.bank + " ···· " + a.last); say(a.bank + " is now your default"); });
  const del = (a) => gate("Remove " + a.bank + " ···· " + a.last, () => { setAccounts((l) => l.filter((x) => x.id !== a.id)); log("Removed payout account " + a.bank + " ···· " + a.last); say("Account removed"); });
  const back = view !== "list" ? <button className="bt s" style={{ alignSelf: "flex-start" }} onClick={() => setView(view === "pin" ? "list" : "list")}><ChevronLeft size={14} />Back</button> : null;
  return <Full dlg title="Payout accounts" onClose={onClose}>
    {back}
    {view === "list" && <>
      <p className="mu">Money you withdraw is paid to your default account. New accounts become active after 24 hours for your safety.</p>
      {accounts.map((a) => <div key={a.id} className={cn("pa", a.def && "def")}><span className="em sm"><Landmark size={20} className="ac" /></span><div className="fl"><div className="b tr">{a.bank} ···· {a.last}</div><div className="xs mu tr">{a.name}</div><div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>{!!a.def && <span className="ch g"><Check size={11} />Default</span>}<span className="ch"><ShieldCheck size={11} />Name matches</span></div></div>
        <div className="col" style={{ gap: 6, alignItems: "flex-end" }}>{!a.def && <button className="bt s o" onClick={() => mkDef(a)}>Make default</button>}<button className="bt s r" disabled={a.def || accounts.length < 2} onClick={() => del(a)}><Trash2 size={13} />Remove</button></div></div>)}
      {!accounts.length && <div className="cd mu" style={{ textAlign: "center" }}>No payout account yet. Add one to withdraw.</div>}
      <button className="bt p" style={{ alignSelf: "flex-start" }} onClick={() => setView("add")}><Plus size={15} />Add account</button>
      {sched && <div className="cd"><div className="lb">{sched.label}</div><div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}><Drop value={sched.value} options={sched.options} onPick={sched.onPick} /><span className="xs mu fl">{sched.note}</span></div></div>}</>}
    {view === "add" && <>
      <div className="lb">Bank</div><Drop value={bank} options={BANKS.map((x) => [x, "", x])} onPick={setBank} />
      <div className="lb">Account number</div><input className="in" inputMode="numeric" maxLength={10} placeholder="10-digit account number" aria-label="Account number" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 10))} />
      {ok && <div className="pl"><Check size={16} className="ac" />{holder.toUpperCase()} · matches your verified profile</div>}
      <p className="xs mu">Only accounts in your own name are accepted. We check the name before you can continue.</p>
      <button className="bt p" style={{ alignSelf: "flex-start" }} disabled={!ok} onClick={() => gate("Add " + bank + " ···· " + num.slice(-4), add)}>Continue</button></>}
    {view === "pin" && pend && <>
      <div className="cd"><div className="lb">Confirm with your PIN</div><div style={{ margin: "6px 0 2px" }} className="b">{pend.label}</div></div>
      <div className="lb">4-digit PIN · demo 1234</div>
      <div className="pin4">{pn.map((d, i) => <input key={i} ref={(e) => (refs.current[i] = e)} autoFocus={i === 0} inputMode="numeric" type="password" maxLength={1} value={d} onChange={(e) => typeP(i, e.target.value)} aria-label={"PIN digit " + (i + 1)} />)}</div>
      <button className="bt p" style={{ alignSelf: "flex-start" }} disabled={pn.join("").length < 4} onClick={confirm}><KeyRound size={15} />Confirm</button></>}
  </Full>;
}
/* Full: edge-to-edge page with close button. `dlg` = centred dialog on desktop, full screen on phones. */
function Full({ title, onClose, foot, up, dlg, children }) {
  useModal(onClose);
  return <Portal>{dlg && <div className="bd" style={{ zIndex: 325 }} onClick={onClose} />}<div className={cn("fs", up && "up", dlg && "dlg")} role="dialog" aria-modal="true" aria-label={title}>
    <div className="hd"><h3 className="fl tr serif" style={{ fontSize: 20 }}>{title}</h3><button className="ib" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
    <div className="bdy">{children}</div>{foot}</div></Portal>;
}

/* ═════════ Shell: header (profile · notifications · messages · support), rails, bottom nav, trending sidebar ═════════ */
function Shell({ tkeys, onMore, mnav, letter, role, nav, tab, setTab, foot, side, mw = 780, convs, notifs, say, thread, onProfile, who, top, children }) {
  const profile = useAuthenticatedProfile();
  const profileName = profile?.display_name || profile?.email || "Account";
  const [bell, setBell] = useState(false), [inb, setInb] = useState(false), [sp, setSp] = useState(false), [nun, setNun] = useState(notifs.filter((n) => n.u).length), [mread, setMread] = useState(false);
  const mun = mread ? 0 : convs.reduce((a, c) => a + (c.un || 0), 0);
  const item = (it, x) => <button key={it.k} className={cn("ni", tab === it.k && "on", it.lk && "lk", x)} onClick={() => (it.go ? it.go() : setTab(it.k))} aria-label={it.l} aria-current={tab === it.k ? "page" : undefined}><span className="ic"><span className="iw">{it.lk ? <Lock size={19} /> : <it.I size={21} />}{it.b ? <span className="bdg">{it.b}</span> : null}</span></span><span className="lt">{it.l}</span></button>;
  return <>
    <div className="lay"><nav className="nv" aria-label="Main"><div className="brand"><span className="lg">{letter}</span><div><b>Dispatch</b><span className="lb">{role}</span></div></div>{nav.map((it) => item(it, tkeys && !tkeys.includes(it.k) ? "xt" : ""))}{tkeys && <button className={cn("ni mr", !tkeys.includes(tab) && "on")} onClick={onMore} aria-label="More sections"><span className="ic"><span className="iw"><Menu size={21} />{nav.some((x) => !tkeys.includes(x.k) && x.b) ? <span className="bdg">{nav.filter((x) => !tkeys.includes(x.k)).reduce((s, x) => s + (x.b || 0), 0) || null}</span> : null}</span></span><span className="lt">More</span></button>}{foot && <div className="nvf">{foot}</div>}</nav>
      <main className="mn" style={{ "--mw": mw + "px" }}>
        <header className="hdr"><button className="pf" onClick={onProfile} aria-label="Open profile"><Av id="me" s={40} on /><span className="t"><b className="tr" style={{ display: "block", maxWidth: 160 }}>{profileName}</b><span>{who}</span></span></button><span className="fl" />
          <button className="ib" aria-label="Notifications" onClick={() => { setBell(true); setNun(0); }}><Bell size={19} />{nun ? <span className="bdg">{nun}</span> : null}</button>
          <button className="ib" aria-label="Messages" onClick={() => { setInb(true); setMread(true); }}><MessageSquareText size={19} />{mun ? <span className="bdg">{mun}</span> : null}</button>
          <button className="ib" aria-label="Support" onClick={() => setSp(true)}><Headset size={19} /></button></header>
        {top}<div className="col">{children}</div></main>
      {side && <aside className="sd" aria-label="Trending">{side}</aside>}</div>
    <nav className="bn" aria-label="Main">{(mnav || nav).map((it) => item(it))}</nav>
    {bell && <Sheet kind="nt" title="Notifications" onClose={() => setBell(false)}>{notifs.length ? notifs.map((n, i) => <div key={i} className="ct2" style={{ alignItems: "flex-start" }}><span className="em sm" style={{ width: 38, height: 38, fontSize: 18 }}>{n.e}</span><div className="fl"><div className="b">{n.t}</div><div className="xs mu">{n.d}</div></div><span className="xs mu">{n.w}</span></div>) : <p className="mu">No notifications yet.</p>}</Sheet>}
    {inb && <Comms mode="inbox" convs={convs} onClose={() => setInb(false)} say={say} thread={thread} />}
    {sp && <Comms mode="support" convs={[{ p: "sup" }]} onClose={() => setSp(false)} say={say} order="Support desk" thread={{ ...thread, canWrite: true, canCall: true, joinable: false }} />}
  </>;
}

/* ══════════════════════════════════════════════════════════════════════
   DISPATCH · RIDER APP — one standalone file (react + lucide-react).
   Jobs are a live list of waiting orders: Details (full screen on phones) or Accept. No countdowns: an order is either there or taken.
   Insights has two sub sections: Insights and a privacy-safe Leaderboard (km or orders only). Settings sits at the bottom of Account.
   ══════════════════════════════════════════════════════════════════════ */
const money = (n) => "₦" + Math.round(n).toLocaleString();
const PPL = { me: { n: "Tunde Bako", r: "Rider", g: ["#60a5fa", "#a78bfa"] }, cust: { n: "Ada O.", r: "Customer", g: ["#22d3ee", "#6366f1"] }, vendor: { n: "Mama Put Kitchen", r: "Vendor", g: ["#fb923c", "#f43f5e"] }, sup: { n: "Dispatch Support", r: "Support", g: ["#c4b5fd", "#a78bfa"] } };
const QR = { Customer: ["I'm outside", "I'm at the gate", "Please come down"], Vendor: ["Is it ready?", "I'm 2 min away", "Wrong order?"], Support: ["Road blocked", "Customer unreachable", "Bike issue"] };
const STEPS = [["Head to vendor", "Confirm pickup"], ["Heading to customer", "I've arrived"], ["At customer's door", "Complete delivery"]];
const CFG = { base: 15000, salt: 3, zero: 0, avg: 1850, step: 10 }, CFT = { base: 9, salt: 11, zero: 0.12, avg: 1, step: 1 };
const NAMES = ["Kemi", "Musa", "Ifeanyi", "Bisi", "Sani", "Chidi", "Hauwa", "Emeka", "Fatima", "Segun", "Ngozi", "Dayo"], GR = [["#60a5fa", "#a78bfa"], ["#fb923c", "#f43f5e"], ["#22d3ee", "#6366f1"], ["#c4b5fd", "#a78bfa"], ["#fbbf24", "#f97316"]];
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const LB = (p) => NAMES.map((n, i) => ({ n: n + " " + String.fromCharCode(65 + (i * 7) % 26) + ".", km: Math.round((p === "W" ? 70 : 260) * (0.55 + rnd(i + 31) * 0.9)), o: Math.round((p === "W" ? 24 : 90) * (0.55 + rnd(i + 57) * 0.9)), g: GR[i % 5] }));
const HOT = [["Wuse 2", 92, "×1.4"], ["Maitama", 78, "×1.2"], ["Garki", 55, ""], ["Jabi", 41, ""]];
const riderOrderView = (order) => ({
  id: "#DL-" + order.order_number,
  dbId: order.id,
  v: order.vendor_name || order.vendor?.name || "Vendor",
  e: order.vendor_emoji || order.vendor?.emoji || "🍽️",
  area: order.pickup_address || order.vendor?.pickup_address || "",
  to: order.delivery_address,
  pk: 0,
  km: 0,
  fare: Number(order.delivery_fee),
  tip: 0,
  pay: "Cash on delivery",
  items: (order.order_items || []).map((item) => item.quantity + "× " + item.item_name),
  note: order.customer_note,
  cust: "Customer",
  req: false,
  min: order.eta_minutes,
  status: order.status
});

export default function RiderApp() {
  const th = useThemeState(), [toast, say] = useToast(), profile = useAuthenticatedProfile();
  const [tab, setTab] = useState("jobs"), [on, setOn] = useState(false), [availabilityReady, setAvailabilityReady] = useState(false), [availabilitySaving, setAvailabilitySaving] = useState(false), [orders, setOrders] = useState([]), [act, setAct] = useState(null), [step, setStep] = useState(0), [det, setDet] = useState(null), [ring, setRing] = useState(null);
  const [setOpen, setSetOpen] = useState(false);
  const refs = useRef([]), detR = useRef(null); detR.current = det;
  useEffect(() => {
    let active = true;
    void getRiderAvailability().then((isAvailable) => {
      if (active) {
        setOn(isAvailable);
        setAvailabilityReady(true);
      }
    }).catch((error) => {
      if (active) say(error instanceof Error ? error.message : "Rider availability setup is required.");
    });
    const refresh = async () => {
      try {
        const [pool, assigned] = await Promise.all([listAvailableRiderOrders(), listRiderOrders()]);
        if (!active) return;
        setOrders(pool.map(riderOrderView));
        const current = assigned.find((order) => order.status === "on_the_way") || assigned[0];
        setAct(current ? riderOrderView(current) : null);
        setStep(current?.status === "on_the_way" ? 1 : 0);
      } catch (error) {
        if (active) say(error instanceof Error ? error.message : "Could not load rider orders.");
      }
    };
    const channel = subscribeToOrders(() => void refresh());
    void refresh();
    return () => {
      active = false;
      if (supabase) void supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line
  const refreshQueue = async () => {
    const available = await listAvailableRiderOrders();
    setOrders(available.map(riderOrderView));
  };
  const toggleAvailability = async () => {
    try {
      setAvailabilitySaving(true);
      await setRiderAvailability(!on);
      setOn(!on);
      await refreshQueue();
      say(!on ? "You are online" : "You are offline");
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not update your availability.");
    } finally {
      setAvailabilitySaving(false);
    }
  };
  const peers = step === 0 ? ["vendor", "cust", "sup"] : ["cust", "vendor", "sup"];
  const accept = async (o) => {
    if (act) { say("Finish your current job first"); return; }
    try {
      await claimRiderOrder(o.dbId);
      setAct(o); setStep(0); setOrders((rows) => rows.filter((row) => row.dbId !== o.dbId)); setDet(null); say("Accepted · head to " + o.v);
    } catch (error) {
      say(error instanceof Error ? error.message : "This order is no longer available.");
    }
  };
  const nextBtn = async () => {
    if (!act) return;
    if (step === 0 && act.status !== "ready") {
      say("Waiting for the vendor to mark this order ready.");
      return;
    }
    if (step === 0) {
      try {
        await setRiderOrderStatus(act.dbId, "on_the_way");
        setAct({ ...act, status: "on_the_way" });
        setStep(1);
      } catch (error) {
        say(error instanceof Error ? error.message : "Could not update delivery status.");
      }
    } else if (step === 1) {
      setStep(2);
    } else {
      await finish();
    }
  };
  const finish = async () => {
    if (!act) return;
    try {
      await setRiderOrderStatus(act.dbId, "delivered");
      setAct(null); setStep(0); say("Delivery completed");
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not complete delivery.");
    }
  };
  const nav = [{ k: "jobs", l: "Jobs", I: Bike, b: orders.length && on ? orders.length : 0 }, { k: "me", l: "Account", I: User }];
  const convs = [];
  const Rk = ({ a, b }) => <div className="rk"><span className="fl b">{a}</span><span className="xs mu">{b}</span></div>;
  const sides = {
    jobs: <SW title="Live queue"><Rk a="Available orders" b={String(orders.length)} /><Rk a="Active delivery" b={act ? act.id : "None"} /><Rk a="Availability" b={on ? "Online" : "Offline"} /></SW>,
    me: <>
      <SW title="Stay safe"><Rk a="Wear a helmet" b="Always" /><Rk a="Night rides" b="Use lit roads" /><Rk a="Emergency" b="Support · header" /></SW>
      <SW title="Documents"><Rk a="Licence" b="Valid" /><Rk a="Vehicle papers" b="Valid" /><Rk a="Insurance" b="Renew in 41 days" /></SW></>,
  };
  const side = sides[tab];
  return <ThemeCtx.Provider value={th.cls}><div className={cn("dl", th.cls)}><style>{CSS}</style>
    <Shell letter="R" role="Rider" nav={nav} tab={tab} setTab={setTab} mw={720} convs={convs} notifs={[]} say={say} who={on ? "Online" : "Offline"} onProfile={() => setTab("me")} side={side}
      foot={<><div className="lb">Availability</div><div className="b" style={{ fontSize: 18, marginTop: 2 }}>{on ? "Online" : "Offline"}</div><div className="xs mu" style={{ marginTop: 4 }}>{orders.length} available orders</div></>}>
      {tab === "jobs" && !availabilityReady && <DemoNotice>Apply the rider-presence migration to enable availability and receive jobs.</DemoNotice>}
      {tab === "jobs" && <>
        <div className="cd row"><div className="fl"><div className="lb">Availability</div><h2 className="serif" style={{ fontSize: 24 }}>{on ? "You're online" : "You're offline"}</h2><div className="xs mu">{on ? "Available orders from the dispatch queue appear below." : "Go online to receive available orders."}</div></div><Tgl big on={on} label="Online" set={toggleAvailability} disabled={!availabilityReady || availabilitySaving} /></div>
        <div className="kp"><div><b>{orders.length}</b><span className="xs mu">Available orders</span></div><div><b>{act ? 1 : 0}</b><span className="xs mu">Active deliveries</span></div><div><b>{act?.min ?? "—"}</b><span className="xs mu">ETA minutes</span></div></div>
        {on && act && <ActiveDelivery act={act} step={step} steps={STEPS} peers={peers} say={say} ring={ring} clearRing={() => setRing(null)} onNext={nextBtn} onDetails={() => setDet(act)} onSimulateCall={() => setRing("cust")} ContactBar={ContactBar} LiveMap={LiveMap} />}
        {on && <><div className="lb">{orders.length ? orders.length + " order" + (orders.length > 1 ? "s" : "") + " available" : "No orders right now"}</div>
          {orders.map((o) => <div key={o.id} className="cd"><div className="row"><span className="em">{o.e}</span><div className="fl"><div className="b tr" style={{ fontSize: 16 }}>{o.v}</div><div className="xs mu tr">{o.area} → {o.to}</div></div><b className="serif" style={{ fontSize: 22 }}>{money(o.fare + o.tip)}</b></div>
            <div className="row" style={{ margin: "12px 0", flexWrap: "wrap", gap: 6 }}><span className="ch"><MapPin size={11} />{o.pk} km to pickup</span><span className="ch"><Route size={11} />{o.km} km trip</span><span className="ch"><Clock size={11} />~{o.min} min</span>{o.tip > 0 && <span className="ch g">+{money(o.tip)} tip</span>}{o.req && <span className="ch g"><Star size={11} />Requested you</span>}</div>
            <div className="acts"><button className="bt" onClick={() => setDet(o)}><Info size={15} />Details</button><button className="bt p" disabled={!!act} onClick={() => accept(o)}><Check size={15} />Accept</button></div></div>)}
          {!orders.length && <div className="cd mu" style={{ textAlign: "center", padding: 34 }}><Zap size={22} className="ac" /><div style={{ marginTop: 8 }}>New orders show up here the moment they land.</div></div>}</>}
        {!on && <div className="cd mu" style={{ textAlign: "center", padding: 34 }}>You're offline. Switch on to start earning.</div>}</>}
      {tab === "earn" && <>
        <WalletCard label="Earnings wallet" amount={money(bal)} id={da ? da.bank + " ···· " + da.last : "No payout account"} delta="+18% this week" spark={[9, 12, 8, 15, 13, 19, 14].map((x) => x * 1000)} sparkLabel="Daily earnings, last 7 days" actions={[{ l: "Cash out", I: Banknote, p: 1, d: !bal, on: () => (da ? setCash(true) : (say("Add a payout account first"), setPayM(true))) }, { l: "Accounts", I: Landmark, on: () => setPayM(true) }]} foot={"To " + dTxt + " · arrives in minutes"} />
        <Timeline cfg={CFG} m={money} live={day.e} liveN={day.n} title="Total earned">{(s) => <>
          <div className="kp">{[[s.n, "Trips"], [money(s.n ? s.total / s.n : 0), "Avg / trip"], [money(Math.round(s.total * 0.11)), "Tips"]].map(([a, b]) => <div key={b}><b>{a}</b><span className="xs mu">{b}</span></div>)}</div>
          <div className="cd"><div className="lb">Where it came from</div>{[["Delivery fares", 74], ["Tips", 11], ["Peak boost", 9], ["Bonuses", 6]].map(([l, p]) => <div key={l} style={{ marginTop: 12 }}><div className="row xs"><span className="fl">{l}</span><b>{money(s.total * p / 100)}</b></div><div className="pb" style={{ marginTop: 5 }}><i style={{ width: p + "%" }} /></div></div>)}</div></>}</Timeline>
        <div className="cd"><div className="row"><div className="fl"><div className="lb">Daily goal</div><div className="b" style={{ fontSize: 20 }}>{money(day.e)} <span className="mu" style={{ fontSize: 13, fontWeight: 500 }}>of {money(goal)}</span></div></div>
          <div className="stp"><button aria-label="Lower goal" onClick={() => setGoal(Math.max(5000, goal - 1000))}><Minus size={14} /></button><button className="p" aria-label="Raise goal" onClick={() => setGoal(goal + 1000)}><Plus size={14} /></button></div></div>
          <div className="pb" style={{ marginTop: 12 }}><i style={{ width: Math.min(100, day.e / goal * 100) + "%" }} /></div><div className="xs mu" style={{ marginTop: 6 }}>{day.e >= goal ? "Goal reached. Everything from here is bonus." : money(goal - day.e) + " to go today"}</div></div>
        <div className="cd"><div className="lb">Payout history</div><TxList icon={Banknote} rows={pays.map(([t, d, a]) => ({ d: "out", t, s: "To " + dTxt, a: money(a), g: d }))} empty="No cash-outs yet." /></div></>}
      {tab === "stats" && <>
        <div className="seg" role="tablist" aria-label="Insights sections"><button role="tab" aria-selected={sub === "i"} className={sub === "i" ? "on" : ""} onClick={() => setSub("i")}><BarChart3 size={14} />Insights</button><button role="tab" aria-selected={sub === "l"} className={sub === "l" ? "on" : ""} onClick={() => setSub("l")}><Trophy size={14} />Leaderboard</button></div>
        {sub === "i" && <Timeline cfg={CFT} m={(n) => Math.round(n) + " trips"} live={day.n} liveN={day.n} title="Trips completed">{(s) => <>
          <div className="kp">{[[s.n, "Trips"], [Math.round(s.n * 3.4) + " km", "Distance"], [Math.round(s.n * 0.55 * 10) / 10 + "h", "Online"], ["94%", "Acceptance"], ["99%", "On time"], ["4.9", "Rating"]].map(([a, b]) => <div key={b}><b>{a}</b><span className="xs mu">{b}</span></div>)}</div>
          <div className="cd"><div className="lb">Your reliability</div>{[["Acceptance rate", 94], ["On-time deliveries", 99], ["Customer rating", 98]].map(([l, p]) => <div key={l} style={{ marginTop: 12 }}><div className="row xs"><span className="fl">{l}</span><b>{l === "Customer rating" ? "4.9 / 5" : p + "%"}</b></div><div className="pb" style={{ marginTop: 5 }}><i style={{ width: p + "%" }} /></div></div>)}</div>
          <div className="cd"><div className="lb">Badges earned</div><div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 10 }}>{["🔥 12-day streak", "⚡ Fast mover", "⭐ 5-star week", "🛡️ Zero cancellations"].map((b) => <span key={b} className="ch g" style={{ fontSize: 12.5, padding: "6px 12px" }}>{b}</span>)}</div>
            <button className="bt o w" style={{ marginTop: 14 }} onClick={() => share("🏍️ My Dispatch week: " + s.n + " trips, " + Math.round(s.n * 3.4) + " km, 4.9★ rating, 99% on time.")}><Share2 size={15} />Share my performance</button><p className="xs mu" style={{ marginTop: 8 }}>The shared card shows trips, distance and rating only. Never earnings or locations.</p></div></>}</Timeline>}
        {sub === "l" && <>
          <div className="seg" role="radiogroup" aria-label="Rank by">{[["km", "Kilometres"], ["o", "Orders completed"]].map(([k, l]) => <button key={k} role="radio" aria-checked={lm === k} className={lm === k ? "on" : ""} onClick={() => setLm(k)}>{l}</button>)}</div>
          <div className="seg" role="radiogroup" aria-label="Period">{[["W", "This week"], ["M", "This month"]].map(([k, l]) => <button key={k} role="radio" aria-checked={lp === k} className={lp === k ? "on" : ""} onClick={() => setLp(k)}>{l}</button>)}</div>
          <div className="cd hl"><div className="row"><span className="lb fl">Your rank · {lm === "km" ? "distance" : "orders"}</span><Crown size={18} className="ac" /></div><div className="row" style={{ alignItems: "baseline", gap: 12, marginTop: 4 }}><h1 className="serif" style={{ fontSize: 48 }}>#{myR}</h1><div className="fl"><div className="b" style={{ fontSize: 20 }}>{rows[myR - 1][lm]}{unit}</div><div className="xs mu">{myR === 1 ? "You lead the pack" : (rows[myR - 2][lm] - rows[myR - 1][lm]) + unit.trim() + " to reach #" + (myR - 1)} · of {rows.length} riders</div></div></div>
            <button className="bt p w" style={{ marginTop: 14 }} onClick={() => share(myTxt)}><Share2 size={15} />Share my rank</button></div>
          <div className="cd"><div className="lb">Top riders · {lp === "W" ? "this week" : "this month"}</div>{rows.slice(0, 10).map(Lrow)}{myR > 10 && <><div className="xs mu" style={{ textAlign: "center", padding: "6px 0" }}>· · ·</div>{Lrow(rows[myR - 1], myR - 1)}</>}</div>
          <div className="pl"><ShieldCheck size={16} className="ac" />Safe by design: only first name, distance and completed orders are shown. No earnings, bank details, phone numbers or live locations. You can hide yourself in Settings.</div></>}</>}
      {tab === "me" && <>
        <div className="cd hl row"><Av id="me" s={64} /><div className="fl"><h2 className="serif" style={{ fontSize: 22 }}>{profile?.display_name || "Rider"}</h2><div className="xs mu tr">{profile?.email || "Email unavailable"}</div><div className="xs mu">Rider account</div></div></div>
        <ProfileEditor />
        <div className="kp"><div><b>{act ? 1 : 0}</b><span className="xs mu">Active deliveries</span></div><div><b>{orders.length}</b><span className="xs mu">Available orders</span></div><div><b>Not connected</b><span className="xs mu">Payouts</span></div></div>
        <div className="cd"><div className="lb">Rider details</div><p className="xs mu" style={{ marginTop: 8 }}>Vehicle, documents, ratings, and payout details are not stored in your profile yet.</p></div>
        <button className="setrow" onClick={() => setSetOpen(true)}><Settings size={20} className="ac" /><span className="fl">Settings</span><ChevronRight size={18} className="mu" /></button></>}
    </Shell>
    {det && <Full dlg title="Order details" onClose={() => setDet(null)} foot={!act || act.id !== det.id ? <div className="fb"><button className="bt p w xl" disabled={!!act} onClick={() => accept(det)}><Check size={20} />{act ? "Finish your current job first" : "Accept · " + money(det.fare + det.tip)}</button></div> : null}>
      <div className="cd row"><span className="em">{det.e}</span><div className="fl"><h2 className="serif" style={{ fontSize: 22 }}>{det.v}</h2><div className="xs mu">{det.id} · {det.area}</div></div><b className="serif" style={{ fontSize: 24 }}>{money(det.fare + det.tip)}</b></div>
      <LiveMap orderId={det.dbId} active={false} />
      <div className="cd col" style={{ gap: 12 }}><div className="row"><Store size={17} className="ac" /><div className="fl"><div className="lb">Pickup</div><div className="b">{det.v}, {det.area}</div></div><span className="xs mu">{det.pk} km away</span></div><div className="row"><MapPin size={17} className="ac" /><div className="fl"><div className="lb">Drop-off</div><div className="b">{det.to}</div><div className="xs mu">For {det.cust} · phone stays private</div></div><span className="xs mu">{det.km} km</span></div></div>
      <div className="cd"><div className="lb">Items · {det.items.length}</div>{det.items.map((x) => <div key={x} className="rk"><Package size={16} className="ac" /><span className="fl">{x}</span></div>)}{det.note && <div className="ch o" style={{ marginTop: 10, whiteSpace: "normal" }}>Note: {det.note}</div>}</div>
      <div className="cd"><div className="lb">Payment and fare</div>{[["Payment", det.pay], ["Base fare", money(det.fare - Math.round(det.km * 14) * 10)], ["Distance · " + det.km + " km", money(Math.round(det.km * 14) * 10)], ["Tip", money(det.tip)]].map(([a, b]) => <div key={a} className="rk"><span className="fl mu">{a}</span><b>{b}</b></div>)}<div className="rk"><span className="fl b">You earn</span><b className="ac">{money(det.fare + det.tip)}</b></div></div>
      <div className="row xs mu"><Timer size={14} />Estimated {det.min} min door to door · paid instantly on delivery</div></Full>}
    {payM && <Payouts holder="Tunde Bako" accounts={accts} setAccounts={setAccts} say={say} onClose={() => setPayM(false)} sched={{ label: "Cash-out schedule", value: sch, options: [["instant", "", "Instant cash-out"], ["daily", "", "Daily at 6 PM"], ["weekly", "", "Weekly · Monday"]], onPick: setSch, note: "Instant cash-out is free." }} />}
    {cash && <Sheet title="Cash out" onClose={() => setCash(false)}><div className="cd" style={{ padding: 12 }}><div className="lb">To</div><div className="b">{dTxt}</div></div><button className="bt p w xl" onClick={() => { setPays([["Cash out", "Just now", bal], ...pays]); setBal(0); setCash(false); say("Cash out sent · arrives in minutes"); }}>Send {money(bal)}</button></Sheet>}
    {setOpen && <Full title="Settings" onClose={() => setSetOpen(false)}>
      <div className="cd"><div className="lb" style={{ marginBottom: 10 }}>Appearance</div><ThemeSwitch th={th} /><p className="xs mu" style={{ marginTop: 8 }}>Light is bright and crisp for daytime rides. Dark is easier on the eyes at night. Auto follows your phone.</p></div>
      <div className="cd"><div className="lb">Riding</div>{[["snd", "Job sounds", "Loud tone when an order lands"], ["idle", "Auto offline", "Go offline after 20 min idle"], ["waze", "Open Waze for routes", "Otherwise your default maps app"]].map(([k, t, d]) => <Rw key={k} t={t} d={d}><Tgl on={prefs[k]} label={t} set={() => tog(k, t)} /></Rw>)}</div>
      <div className="cd"><div className="lb">Privacy</div><Rw t="Show me on the leaderboard" d="Others see your first name, km and orders only"><Tgl on={prefs.lb} label="Leaderboard" set={() => tog("lb", "Leaderboard visibility")} /></Rw></div>
      <div className="cd"><div className="lb">Help and support</div><div style={{ marginTop: 10 }}><ContactBar peers={["sup"]} say={say} /></div></div>
      <SignOut say={say} who={profile?.display_name || profile?.email || "Rider"} /></Full>}
    <Toast t={toast} /></div></ThemeCtx.Provider>;
}
const MapboxOrderMap = lazy(() => import("../../../packages/ui/src/components/MapboxOrderMap").then((module) => ({ default: module.MapboxOrderMap })));
function LiveMap({ orderId, active = false }) {
  return <Suspense fallback={<div className="map" role="status">Loading Mapbox…</div>}><MapboxOrderMap orderId={orderId} mode="publish" active={active} /></Suspense>;
}