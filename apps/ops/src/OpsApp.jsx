import { Fragment, useState, useEffect, useRef, useContext, createContext } from "react";
import { assignOpsOrder, listOpsOrders, listOpsRiders, listOrderMessages, sendOrderMessage, subscribeToOrderMessages, subscribeToOrders, supabase } from "@zaradrop/core";
import { Timeline } from "@zaradrop/ui";
import { DemoNotice } from "@zaradrop/ui";
import { EyeOff, Search, Clock, MapPin, Phone, PhoneOff, Mic, MicOff, Volume2, MessageCircle, MessageSquareText, Send, X, ShieldCheck, Plus, Minus, ChevronLeft, ChevronRight, ChevronDown, Check, Wallet, Banknote, Navigation, Bell, ArrowDownLeft, ArrowUpRight, Award, LogOut, Landmark, Headset, Settings, Moon, Sun, Monitor, Bike, Store, Ban, Users, Activity, Truck, ScrollText, Lock, Eye, RefreshCw, Undo2, UserCog, Radio, TriangleAlert, Gift, Menu, Ticket, Flag, Route, KeyRound, UserCheck, Trash2 } from "lucide-react";

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
function Av({ id, s = 40, on }) { const p = PPL[id]; return <span className="av" style={{ "--s": s + "px", "--g1": p.g[0], "--g2": p.g[1] }}>{p.n[0]}{on && <i />}</span>; }
const Tgl = ({ on, set, label, big }) => <button className={cn("tgl", big && "big", on && "on")} role="switch" aria-checked={!!on} aria-label={label} onClick={set} />;
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
  const [cur, setCur] = useState(start), [log, setLog] = useState(() => Object.fromEntries(peers.map((p) => [p, (orderId ? [] : SEED[p] || []).map((x) => ({ me: 0, x, t: "2m" }))]))), [ty, setTy] = useState(false), [v, setV] = useState(""), [joined, setJoined] = useState(false), [error, setError] = useState(""), end = useRef(null);
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
    x = x.trim(); if (!x || !canWrite) return; setV(""); setError("");
    if (orderId) {
      try { await sendOrderMessage(orderId, x); onSend && onSend(cur); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send this message."); }
      return;
    }
    setLog((l) => ({ ...l, [cur]: [...(l[cur] || []), { me: 1, x, t: "now" }] })); onSend && onSend(cur); setTy(true); const w = cur; setTimeout(() => { setTy(false); setLog((l) => ({ ...l, [w]: [...(l[w] || []), { me: 0, x: "Got it 👍", t: "now" }] })); }, 1500);
  };
  const join = () => { setJoined(true); setLog((l) => ({ ...l, [cur]: [...(l[cur] || []), { sys: 1, x: "Support joined this conversation" }] })); onSend && onSend(cur, "join"); };
  const body = <>
    <div className="hd"><Av id={cur} s={42} on /><div className="fl"><div className="b tr">{PPL[cur].n}</div><div className="xs ac">{PPL[cur].r} · online{canWrite ? " · replies instantly" : " · read-only"}</div></div>
      <button className="ib g" aria-label="Call" disabled={!canCall} onClick={() => onCall(cur)}>{canCall ? <Phone size={18} /> : <Lock size={15} />}</button>{!inline && <button className="ib" aria-label="Close chat" onClick={onClose}><X size={18} /></button>}</div>
    {!inline && peers.length > 1 && <div className="pt">{peers.map((p) => <button key={p} className={cur === p ? "on" : ""} onClick={() => setCur(p)}><Av id={p} s={24} />{PPL[p].r}</button>)}</div>}
    <div className="bdy" style={{ gap: 8 }}><div className="sy">{order ? order + " · " : ""}{canWrite ? "free, no airtime" : "read-only for your role"}</div>
      {(log[cur] || []).map((m, i) => m.sys ? <div key={i} className="sy">{m.x}</div> : <div key={i} className={cn("mg", m.me && "me")}>{m.x}<small>{m.t}{m.me ? " · ✓✓" : ""}</small></div>)}{ty && <div className="ty"><i /><i /><i /></div>}{error && <p className="xs" role="alert">{error}</p>}<div ref={end} /></div>
    {!canWrite ? <div className="pl w ro"><Lock size={15} />Your role can read this thread but not write in it.</div> : <>
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
  const [bell, setBell] = useState(false), [inb, setInb] = useState(false), [sp, setSp] = useState(false), [nun, setNun] = useState(notifs.filter((n) => n.u).length), [mread, setMread] = useState(false);
  const mun = mread ? 0 : convs.reduce((a, c) => a + (c.un || 0), 0);
  const item = (it, x) => <button key={it.k} className={cn("ni", tab === it.k && "on", it.lk && "lk", x)} onClick={() => (it.go ? it.go() : setTab(it.k))} aria-label={it.l} aria-current={tab === it.k ? "page" : undefined}><span className="ic"><span className="iw">{it.lk ? <Lock size={19} /> : <it.I size={21} />}{it.b ? <span className="bdg">{it.b}</span> : null}</span></span><span className="lt">{it.l}</span></button>;
  return <>
    <div className="lay"><nav className="nv" aria-label="Main"><div className="brand"><span className="lg">{letter}</span><div><b>Dispatch</b><span className="lb">{role}</span></div></div>{nav.map((it) => item(it, tkeys && !tkeys.includes(it.k) ? "xt" : ""))}{tkeys && <button className={cn("ni mr", !tkeys.includes(tab) && "on")} onClick={onMore} aria-label="More sections"><span className="ic"><span className="iw"><Menu size={21} />{nav.some((x) => !tkeys.includes(x.k) && x.b) ? <span className="bdg">{nav.filter((x) => !tkeys.includes(x.k)).reduce((s, x) => s + (x.b || 0), 0) || null}</span> : null}</span></span><span className="lt">More</span></button>}{foot && <div className="nvf">{foot}</div>}</nav>
      <main className="mn" style={{ "--mw": mw + "px" }}>
        <header className="hdr"><button className="pf" onClick={onProfile} aria-label="Open profile"><Av id="me" s={40} on /><span className="t"><b className="tr" style={{ display: "block", maxWidth: 160 }}>{PPL.me.n}</b><span>{who}</span></span></button><span className="fl" />
          <button className="ib" aria-label="Notifications" onClick={() => { setBell(true); setNun(0); }}><Bell size={19} />{nun ? <span className="bdg">{nun}</span> : null}</button>
          <button className="ib" aria-label="Messages" onClick={() => { setInb(true); setMread(true); }}><MessageSquareText size={19} />{mun ? <span className="bdg">{mun}</span> : null}</button>
          <button className="ib" aria-label="Support" onClick={() => setSp(true)}><Headset size={19} /></button></header>
        {top}<div className="col">{children}</div></main>
      {side && <aside className="sd" aria-label="Trending">{side}</aside>}</div>
    <nav className="bn" aria-label="Main">{(mnav || nav).map((it) => item(it))}</nav>
    {bell && <Sheet kind="nt" title="Notifications" onClose={() => setBell(false)}>{notifs.map((n, i) => <div key={i} className="ct2" style={{ alignItems: "flex-start" }}><span className="em sm" style={{ width: 38, height: 38, fontSize: 18 }}>{n.e}</span><div className="fl"><div className="b">{n.t}</div><div className="xs mu">{n.d}</div></div><span className="xs mu">{n.w}</span></div>)}</Sheet>}
    {inb && <Comms mode="inbox" convs={convs} onClose={() => setInb(false)} say={say} thread={thread} />}
    {sp && <Comms mode="support" convs={[{ p: "sup" }]} onClose={() => setSp(false)} say={say} order="Support desk" thread={{ ...thread, canWrite: true, canCall: true, joinable: false }} />}
  </>;
}

/* ══════════════════════════════════════════════════════════════════════
   DISPATCH · OPERATIONS — one standalone file (react + lucide-react).
   Live monitor · Dispatch · Riders · Vendors · Customers · Bonuses · Support · Fees and zones · Money · Team · Audit · Account.
   "Preview as" switches the role: sections lock, buttons lock, chats go read-only. Super admin edits the permission matrix live.
   Every action is written to the Audit log. Settings (theme, security) sits at the bottom of Account.
   ══════════════════════════════════════════════════════════════════════ */
const money = (n) => "₦" + Math.round(n).toLocaleString();
const PPL = { me: { n: "Operations HQ", r: "Operations", g: ["#c4b5fd", "#a78bfa"] }, cust: { n: "Customer", r: "Customer", g: ["#22d3ee", "#6366f1"] }, rider: { n: "Rider", r: "Rider", g: ["#60a5fa", "#a78bfa"] }, vendor: { n: "Vendor", r: "Vendor", g: ["#fb923c", "#f43f5e"] }, sup: { n: "Dispatch Support", r: "Support", g: ["#c4b5fd", "#a78bfa"] } };
const QR = { Customer: ["We're on it", "Sorry for the delay", "Refund is on the way"], Rider: ["Where are you?", "Customer is waiting", "Need a swap?"], Vendor: ["Is it ready?", "Rider is outside", "Please hurry"], Support: ["Need help", "Escalating", "Thanks"] };
const SEED = { cust: ["Hello, I need help with my order."], rider: [], vendor: [], sup: ["Hi team, we're here if you need anything."] };
const PERMS = [["view", "See live orders, people and audit"], ["chat", "Write in chats"], ["call", "Call from an order"], ["assign", "Assign and reassign riders"], ["tickets", "Work support tickets"], ["users", "Suspend and reinstate people"], ["gift", "Gift bonuses and wallet credit"], ["bonus", "Edit the rider bonus model"], ["pricing", "Edit fees, zones and commission"], ["refund", "Issue refunds"], ["payout", "Approve payouts"], ["team", "Manage team and roles"]];
const PL = Object.fromEntries(PERMS);
const ROLES = { support: ["Support agent", ["view", "chat", "call", "tickets"]], dispatch: ["Dispatcher", ["view", "chat", "call", "assign"]], finance: ["Finance", ["view", "refund", "payout", "gift"]], manager: ["Ops manager", ["view", "chat", "call", "assign", "tickets", "users", "gift", "bonus", "pricing", "refund"]], admin: ["Super admin", PERMS.map((p) => p[0])] };
const NAV = [["live", "Live", Activity, "view"], ["dispatch", "Dispatch", Truck, "assign"], ["riders", "Riders", Bike, "view"], ["vendors", "Vendors", Store, "view"], ["customers", "Customers", UserCheck, "view"], ["bonus", "Bonuses", Award, "bonus|gift"], ["support", "Support", Headset, "tickets|users"], ["fees", "Fees and zones", Route, "pricing"], ["money", "Money", Wallet, "refund|payout"], ["team", "Team", Users, "team"], ["audit", "Audit", ScrollText, "view"], ["me", "Account", UserCog, ""]];
const MOB = ["live", "dispatch", "riders", "support"], TAB = ["live", "dispatch", "riders", "vendors", "support"];
const STAGES = ["Placed", "Preparing", "Ready", "On the way", "Delivered"];
const ZN = ["Wuse 2", "Maitama", "Garki", "Jabi", "Gwarinpa", "Asokoro"];
const GR = [["#fb923c", "#f43f5e"], ["#60a5fa", "#a78bfa"], ["#22d3ee", "#6366f1"], ["#c4b5fd", "#a78bfa"], ["#fbbf24", "#f97316"]];
const Pa = ({ n, i = 0, s = 38 }) => <span className="av" style={{ "--s": s + "px", "--g1": GR[i % 5][0], "--g2": GR[i % 5][1] }}>{n[0]}</span>;
const Stp = ({ v, set, step = 1, min = 0, max = 99999, f = (x) => x, dis, label }) => <div className="stp"><button disabled={dis || v <= min} aria-label={"Decrease " + label} onClick={() => set(Math.max(min, +(v - step).toFixed(2)))}><Minus size={14} /></button><b style={{ minWidth: 58, textAlign: "center" }}>{f(v)}</b><button className="p" disabled={dis || v >= max} aria-label={"Increase " + label} onClick={() => set(Math.min(max, +(v + step).toFixed(2)))}><Plus size={14} /></button></div>;
const RS = { online: ["g", "Online"], delivering: ["bl", "On delivery"], offline: ["", "Offline"], pending: ["o", "Pending approval"], suspended: ["r", "Suspended"] };
const VS = { open: ["g", "Open"], paused: ["o", "Paused"], pending: ["o", "Pending approval"], suspended: ["r", "Suspended"] };
const CS = { active: ["g", "Active"], flagged: ["o", "Flagged"], suspended: ["r", "Suspended"] };
const rd = (id, n, zone, st, rate, today, week, km, acc, veh, since, docs, bonus, strikes) => ({ id, n, zone, st, rate, today, week, km, acc, veh, since, docs, bonus, strikes });
const R0 = [rd("r1", "Tunde Bako", "Wuse 2", "delivering", 4.9, 7, 52, 310, 94, "Motorbike", "Mar 2025", 1, 6500, 0), rd("r2", "Musa Danjuma", "Garki", "delivering", 4.7, 5, 41, 268, 90, "Motorbike", "Jun 2025", 1, 3000, 0), rd("r3", "Ifeanyi Nwosu", "Maitama", "online", 4.8, 6, 47, 281, 92, "Motorbike", "Jan 2025", 1, 4500, 1), rd("r4", "Bisi Adeyemi", "Jabi", "online", 4.6, 3, 33, 190, 86, "Bicycle", "Aug 2025", 1, 1500, 0), rd("r5", "Sani Lawal", "Gwarinpa", "online", 4.5, 4, 29, 176, 83, "Motorbike", "Sep 2025", 1, 500, 1), rd("r6", "Chidi Okafor", "Wuse 2", "offline", 4.4, 0, 22, 140, 79, "Motorbike", "Oct 2025", 1, 0, 2), rd("r7", "Aisha Bello", "Asokoro", "offline", 4.9, 0, 38, 220, 96, "Scooter", "Feb 2025", 1, 3000, 0), rd("r8", "Emeka Obi", "Garki", "suspended", 3.9, 0, 4, 31, 61, "Motorbike", "Nov 2025", 0, 0, 3), rd("r9", "Hauwa Garba", "Maitama", "pending", 0, 0, 0, 0, 0, "Motorbike", "This week", 0, 0, 0), rd("r10", "Segun Alade", "Jabi", "pending", 0, 0, 0, 0, 0, "Bicycle", "This week", 1, 0, 0), rd("r11", "Yusuf Aliyu", "Gwarinpa", "online", 4.7, 5, 44, 257, 91, "Motorbike", "Apr 2025", 1, 4500, 0), rd("r12", "Ngozi Eze", "Asokoro", "offline", 4.6, 0, 27, 160, 85, "Scooter", "Jul 2025", 1, 1000, 0)];
const vd = (id, n, kind, zone, st, rate, orders, comm, bal) => ({ id, n, kind, zone, st, rate, orders, comm, bal });
const V0 = [vd("v1", "Mama Put Kitchen", "Kitchen", "Wuse 2", "open", 4.8, 96, 12, 412500), vd("v2", "Suya Spot", "Restaurant", "Garki", "open", 4.7, 78, 12, 286000), vd("v3", "Cafe Neo", "Restaurant", "Maitama", "open", 4.6, 64, 12, 190400), vd("v4", "Pizza Yard", "Restaurant", "Jabi", "paused", 4.5, 41, 13, 120800), vd("v5", "Tea Terrace", "Restaurant", "Wuse 2", "open", 4.7, 38, 12, 98000), vd("v6", "FreshMart", "Store", "Gwarinpa", "open", 4.5, 52, 9, 340200), vd("v7", "HealthPlus Pharmacy", "Pharmacy", "Maitama", "open", 4.8, 33, 8, 154300), vd("v8", "Auntie Muni's Kitchen", "Kitchen", "Garki", "pending", 0, 0, 12, 0), vd("v9", "Karibu Kitchen", "Kitchen", "Asokoro", "suspended", 3.8, 0, 12, 22000), vd("v10", "Gogo's Kitchen", "Kitchen", "Jabi", "open", 4.8, 45, 12, 176900)];
const cd2 = (id, n, orders, spent, wallet, st, since, refunds) => ({ id, n, orders, spent, wallet, st, since, refunds });
const C0 = [cd2("c1", "Ada Okoro", 48, 312000, 24500, "active", "Jan 2025", 1), cd2("c2", "Chike Obi", 31, 205400, 3200, "active", "Mar 2025", 2), cd2("c3", "Zainab Yusuf", 22, 138000, 0, "active", "May 2025", 0), cd2("c4", "Peter Eze", 17, 98200, 1500, "flagged", "Jun 2025", 6), cd2("c5", "Halima Sule", 64, 468300, 12000, "active", "Nov 2024", 1), cd2("c6", "Kelechi Okeke", 9, 41500, 800, "active", "Aug 2025", 0), cd2("c7", "Tosin Adebayo", 5, 18400, 0, "suspended", "Sep 2025", 9), cd2("c8", "Bola Ige", 27, 171900, 5200, "active", "Apr 2025", 2), cd2("c9", "Dami Cole", 12, 62300, 2100, "active", "Jul 2025", 0), cd2("c10", "Maryam Bala", 3, 9800, 0, "active", "This week", 0)];
const T0 = [{ id: "T-1042", who: "cust", name: "Chike Obi", order: "#DL-4830", subj: "Order is 40 minutes late", cat: "Late order", pr: "high", st: "open", age: "6m", amt: 6200 }, { id: "T-1041", who: "cust", name: "Peter Eze", order: "#DL-4836", subj: "Pizza arrived cold", cat: "Food quality", pr: "med", st: "prog", age: "22m", amt: 12500 }, { id: "T-1040", who: "rider", name: "Musa Danjuma", order: "#DL-4830", subj: "Vendor not releasing the order", cat: "Pickup issue", pr: "high", st: "open", age: "9m", amt: 0 }, { id: "T-1039", who: "vendor", name: "Cafe Neo", order: "", subj: "Settlement amount looks lower", cat: "Payout", pr: "med", st: "open", age: "1h", amt: 0 }, { id: "T-1038", who: "cust", name: "Zainab Yusuf", order: "#DL-4833", subj: "No rider assigned yet", cat: "Late order", pr: "high", st: "open", age: "3m", amt: 5800 }, { id: "T-1037", who: "cust", name: "Ada Okoro", order: "#DL-4812", subj: "Wrong item delivered", cat: "Wrong item", pr: "low", st: "done", age: "2h", amt: 3200 }];
const opsOrderView = (order, riderProfiles) => ({
  id: "#DL-" + order.order_number,
  dbId: order.id,
  cust: "Customer",
  vend: order.vendor?.name || "Vendor",
  vendorId: order.vendor_id,
  riderId: order.rider_id,
  rider: riderProfiles.find((rider) => rider.id === order.rider_id)?.display_name || null,
  paymentMethod: order.payment_method,
  paymentStatus: order.payment_status,
  createdAt: order.created_at,
  etaMinutes: order.eta_minutes,
  st: ({ placed: 0, preparing: 1, ready: 2, on_the_way: 3, delivered: 4, cancelled: 4 })[order.status] ?? 0,
  status: order.status,
  amt: Number(order.total)
});
const lateMinutes = (order, now) => {
  if (!order || ['delivered', 'cancelled'].includes(order.status)) return 0;
  const deadline = new Date(order.createdAt).getTime() + order.etaMinutes * 60_000;
  return Number.isFinite(deadline) ? Math.max(0, Math.floor((now - deadline) / 60_000)) : 0;
};
const isDispatchable = (order) => order.paymentMethod !== 'paystack' || order.paymentStatus === 'paid';
const orderStatusLabel = (order) => order.status === 'cancelled' ? 'Cancelled' : order.paymentMethod === 'paystack' && order.paymentStatus !== 'paid' ? order.paymentStatus === 'failed' ? 'Payment failed' : 'Awaiting payment' : STAGES[order.st];
const PAY0 = [["Riders · this week", "41 riders", 2400000], ["Vendors · this week", "18 vendors", 8100000], ["Rider bonuses · this week", "29 riders", 186500]];
const REF0 = [["#DL-4812", "Wrong item", 3200], ["#DL-4809", "Cold food", 4500]];
const TEAM0 = [["Amaka Obi", "support"], ["Dele Bankole", "dispatch"], ["Ngozi Eze", "finance"], ["Tola Ade", "manager"], ["You", "admin"]];
const G0 = [{ n: "Tunde Bako", amt: 2000, note: "Rainy-day heroics", by: "Ops manager", t: "Yesterday", k: "rider" }, { n: "Aisha Bello", amt: 1000, note: "5★ week", by: "Super admin", t: "Mon", k: "rider" }];
const B0 = { tiers: [[5, 500], [10, 1500], [15, 3000], [20, 5000]], lunch: { on: 1, m: 1.2 }, dinner: { on: 1, m: 1.3 }, rain: { on: 0, a: 200 }, far: { on: 1, a: 50 }, night: { on: 1, a: 150 }, streak: { on: 1, days: 5, orders: 8, a: 3000 }, minAcc: 80, minRate: 4.2, maxCx: 3, docs: 1, budget: 500000, cap: 12000, pay: "weekly" };
const Z0 = { fees: { comm: 12, share: 80, svc: 100, min: 1500 }, zones: [{ n: "Wuse 2", on: 1, base: 500, km: 80, surge: 1.4 }, { n: "Maitama", on: 1, base: 600, km: 90, surge: 1.2 }, { n: "Garki", on: 1, base: 450, km: 70, surge: 1 }, { n: "Jabi", on: 1, base: 500, km: 75, surge: 1 }, { n: "Gwarinpa", on: 1, base: 600, km: 85, surge: 1.1 }, { n: "Asokoro", on: 0, base: 650, km: 90, surge: 1 }] };
const NOTIFS = [{ e: "⏱", t: "Order #DL-4830 is late", d: "Suya Spot · 9 minutes over", w: "now", u: 1 }, { e: "🛵", t: "No rider on #DL-4833", d: "Cafe Neo is waiting", w: "2m", u: 1 }, { e: "🪪", t: "2 riders waiting for approval", d: "Hauwa Garba, Segun Alade", w: "20m" }, { e: "↩", t: "2 refund requests", d: "Awaiting finance", w: "1h" }];
const REASONS = { r: [["safety", "", "Safety complaint"], ["fraud", "", "Fraud or fake deliveries"], ["conduct", "", "Poor conduct"], ["docs", "", "Documents expired"], ["other", "", "Other"]], v: [["hyg", "", "Hygiene complaint"], ["quality", "", "Repeated quality issues"], ["fraud", "", "Pricing or payment fraud"], ["docs", "", "Licence expired"], ["other", "", "Other"]], c: [["fraud", "", "Payment fraud"], ["abuse", "", "Abuse of riders or staff"], ["refund", "", "Refund abuse"], ["other", "", "Other"]] };
const DURS = [["24h", "", "24 hours"], ["7d", "", "7 days"], ["review", "", "Until review"]];
const calcB = (b, s) => {
  const tier = [...b.tiers].reverse().find((t) => s.n >= t[0]), tb = tier ? tier[1] : 0, pm = ((b.lunch.on ? b.lunch.m : 1) + (b.dinner.on ? b.dinner.m : 1)) / 2;
  const L = [["Milestone bonus" + (tier ? " · " + tier[0] + " orders" : ""), tb], ["Peak-hour boost", Math.round(s.peak * 600 * (pm - 1))], ["Rain boost", s.rain && b.rain.on ? s.n * b.rain.a : 0], ["Long-distance bonus", b.far.on ? Math.round(Math.max(0, s.km - 5) * b.far.a * s.n) : 0], ["Night rides", b.night.on ? s.night * b.night.a : 0]];
  const raw = L.reduce((a, x) => a + x[1], 0), ok = s.acc >= b.minAcc && s.rate >= b.minRate;
  return { L, raw, cap: Math.min(raw, b.cap), ok };
};
const CSS2 = `.kp.k4{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:699px){.kp.k4{grid-template-columns:repeat(2,minmax(0,1fr))}}
.split{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}.split>.dsk{display:none}@media(min-width:1480px){.split{grid-template-columns:minmax(260px,360px) minmax(0,1fr)}.split>.dsk{display:block}}
.oi{display:block;width:100%;text-align:left;padding:14px;border-radius:16px;border:1px solid var(--bd);background:var(--s1);margin-bottom:8px;transition:border-color .15s,background .15s}.oi:hover{border-color:var(--bh)}.oi.on{border-color:var(--ab);background:var(--as)}
.rs{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0}.rs button{flex:none;display:flex;align-items:center;gap:6px;height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--bd);color:var(--mu);font-weight:700;font-size:12.5px}.rs button.on{background:var(--ag);color:var(--acx);border-color:var(--ac)}
.mx{width:100%;min-width:640px;border-collapse:collapse;font-size:12.5px}.mx th{padding:10px 8px;text-align:center}.mx td{padding:6px 8px;border-top:1px solid var(--bd);text-align:center}.mx td:first-child{text-align:left}
.mx .cell{width:34px;height:34px;border-radius:10px;display:inline-grid;place-items:center;border:1px solid var(--bd);color:var(--mu)}.mx .cell.on{border-color:var(--ab);background:var(--as);color:var(--at)}.mx .cell:not(:disabled):hover{border-color:var(--bh)}.mx .cell:disabled{cursor:not-allowed;opacity:.6}.mx .cur{background:var(--as)}
.log{display:flex;gap:12px;padding:11px 0;border-top:1px solid var(--bd)}.log:first-child{border-top:0}
.nv{overflow-y:auto;scrollbar-width:none}.nv::-webkit-scrollbar{display:none}
.stp button:disabled{opacity:.4;cursor:not-allowed}
.srch{display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;border:1px solid var(--bd);border-radius:999px;background:var(--s1);min-width:180px}.srch input{flex:1;min-width:0;background:none;border:0;outline:0;color:var(--tx)}
.amt{display:flex;gap:8px;flex-wrap:wrap}.amt button{height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--bd);font-weight:700;font-size:13px;color:var(--mu)}.amt button.on{border-color:var(--ab);background:var(--as);color:var(--at)}
.lst>.rk:first-child{border-top:0}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}.mt{position:relative;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 6px 11px;border:1px solid var(--bd);border-radius:16px;background:var(--s1);color:var(--tx);transition:border-color .15s,background .15s}.mt:hover{border-color:var(--bh)}.mt.on{border-color:var(--ab);background:var(--as);color:var(--at)}.mt.lk{opacity:.5}.mt .mi{position:relative;display:grid;place-items:center;width:44px;height:38px;border-radius:12px;border:1px solid var(--bd);background:var(--s2);color:var(--ac)}.mt.on .mi{border-color:var(--ab)}.mt .ml{font-size:12.5px;font-weight:700;text-align:center;line-height:1.2}.mt .bdg{top:-6px;right:-6px}
.mrow{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:1px solid var(--bd);border-radius:16px;background:var(--s1);font-weight:700;margin-bottom:8px}.mrow:disabled{opacity:.5;cursor:not-allowed}`;
export default function OpsApp() {
  const th = useThemeState(), [toast, say] = useToast();
  const [role, setRole] = useState("manager"), [perms, setPerms] = useState(() => Object.fromEntries(Object.entries(ROLES).map(([k, v]) => [k, v[1]]))), [tab, setTab] = useState("live"), [more, setMore] = useState(false);
  const [orders, setOrders] = useState([]), [sel, setSel] = useState(null), [det, setDet] = useState(false), [fl, setFl] = useState("all"), [logs, setLogs] = useState([["Now", "Session started", "System"]]), [pay, setPay] = useState(PAY0), [ref, setRef] = useState(REF0), [asg, setAsg] = useState(null), [setOpen, setSetOpen] = useState(false), [prefs, setPrefs] = useState({ alert: 1, confirm: 1 });
  const [riderProfiles, setRiderProfiles] = useState([]), [ordersReady, setOrdersReady] = useState(false);
  const [riders, setRiders] = useState(R0), [vends, setVends] = useState(V0), [custs, setCusts] = useState(C0), [ent, setEnt] = useState(null), [act, setAct] = useState(null), [reason, setReason] = useState(null), [dur, setDur] = useState("7d"), [amt, setAmt] = useState(1000), [note, setNote] = useState("");
  const [qs, setQs] = useState({ r: "", v: "", c: "" }), [sf, setSf] = useState({ r: "all", v: "all", c: "all", t: "all", z: "all", a: "all", au: "all" });
  const [bonus, setBonus] = useState(B0), [pub, setPub] = useState(B0), [bsub, setBsub] = useState("rules"), [sim, setSim] = useState({ n: 12, peak: 4, km: 6, rain: 0, night: 2, acc: 88, rate: 4.6 }), [gifts, setGifts] = useState(G0), [gf, setGf] = useState({ id: "r1", amt: 1000, note: "" });
  const [tix, setTix] = useState(T0), [tk, setTk] = useState(null), [res, setRes] = useState(null);
  const [pac, setPac] = useState([["Cafe Neo", "Vendor", "Access Bank ···· 5581", "Added 12 min ago"], ["Bisi Adeyemi", "Rider", "Opay ···· 1203", "Added 1 hour ago"]]), [holds, setHolds] = useState({}), [zc, setZc] = useState(Z0), [zp, setZp] = useState(Z0), [team, setTeam] = useState(TEAM0);
  const [clockNow, setClockNow] = useState(Date.now());
  const can = (p) => !p || String(p).split("|").some((x) => perms[role].includes(x)), RN = ROLES[role][0];
  const audit = (m) => setLogs((l) => [["Just now", m, RN], ...l]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [orderRows, ridersRows] = await Promise.all([listOpsOrders(), listOpsRiders()]);
        if (!active) return;
        setRiderProfiles(ridersRows);
        const mapped = orderRows.map((order) => opsOrderView(order, ridersRows));
        setOrders(mapped);
        setSel((selected) => mapped.some((order) => order.id === selected) ? selected : mapped[0]?.id ?? null);
      } catch (error) {
        if (active) say(error instanceof Error ? error.message : "Could not load operations orders.");
      } finally {
        if (active) setOrdersReady(true);
      }
    };
    const channel = subscribeToOrders(() => void refresh());
    void refresh();
    return () => {
      active = false;
      if (supabase) void supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { const n = NAV.find((x) => x[0] === tab); if (n && !can(n[3])) setTab("live"); }, [role, perms]); // eslint-disable-line
  const go = (n) => { setMore(false); if (!can(n[3])) { say("Locked for " + RN + ": needs " + n[3].split("|").map((x) => PL[x].toLowerCase()).join(" or ")); return; } setTab(n[0]); };
  const o = orders.find((x) => x.id === sel) || orders[0] || { id: "", dbId: "", cust: "", vend: "", rider: null, riderId: null, vendorId: "", st: 0, flag: "", amt: 0 };
  PPL.cust.n = o.cust; PPL.rider.n = o.rider || "Rider"; PPL.vendor.n = o.vend;
  const shown = orders.filter((x) => fl === "all" || (fl === "late" && lateMinutes(x, clockNow) > 0) || (fl === "norider" && isDispatchable(x) && !x.riderId && !['delivered', 'cancelled'].includes(x.status)));
  const peers = o.rider ? ["cust", "rider", "vendor"] : ["cust", "vendor"];
  const threadFor = (what) => ({ canWrite: can("chat"), canCall: can("call"), joinable: can("chat"), onSend: (p, k) => audit(k === "join" ? "Joined chat on " + what : "Messaged " + PPL[p].r.toLowerCase() + " on " + what), onCallEnd: (p, s) => { if (s) audit("Called " + PPL[p].r.toLowerCase() + " on " + what + " (" + s + "s)"); } });
  const dist = (id) => ((parseInt(id.slice(1)) * 7) % 25 + 4) / 10;
  const assign = async (riderId) => {
    const targetOrder = orders.find((row) => row.id === asg);
    const rider = riderProfiles.find((profile) => profile.id === riderId);
    if (!targetOrder) return;
    try {
      await assignOpsOrder(targetOrder.dbId, riderId);
      setOrders((rows) => rows.map((row) => row.dbId === targetOrder.dbId ? { ...row, rider: rider?.display_name || "Rider", riderId } : row));
      audit("Assigned " + (rider?.display_name || "rider") + " to " + targetOrder.id);
      say((rider?.display_name || "Rider") + " assigned to " + targetOrder.id);
      setAsg(null);
    } catch (error) {
      say(error instanceof Error ? error.message : "Could not assign this rider.");
    }
  };
  const flag = (order) => {
    const overdue = lateMinutes(order, clockNow);
    if (overdue) return <span className="ch o"><Clock size={11} />Late {overdue} min</span>;
    if (!order.riderId && !['delivered', 'cancelled'].includes(order.status)) return <span className="ch r">No rider</span>;
    return null;
  };
  const activeOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));
  const unassignedOrders = activeOrders.filter((order) => isDispatchable(order) && !order.riderId);
  const overdueOrders = activeOrders.filter((order) => lateMinutes(order, clockNow) > 0);
  const attn = activeOrders.filter((order) => lateMinutes(order, clockNow) > 0 || (isDispatchable(order) && !order.riderId)).length;
  const pendR = riders.filter((r) => r.st === "pending").length, openT = tix.filter((x) => x.st !== "done").length;
  const refund = (id, a) => { audit("Refunded " + id + " " + money(a)); say(id + " refunded"); };
  const setR = (id, p) => setRiders((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x))), setV = (id, p) => setVends((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x))), setC = (id, p) => setCusts((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const patch = { r: setR, v: setV, c: setC }, lists = { r: riders, v: vends, c: custs }, tag = { r: "rider", v: "vendor", c: "customer" };
  const E = ent && lists[ent.k].find((x) => x.id === ent.id);
  const spentToday = 318400 + gifts.filter((g) => g.k === "rider" && g.t === "Just now").reduce((a, g) => a + g.amt, 0);
  const upd = (fn) => { if (!can("bonus")) { say("Needs permission: " + PL.bonus.toLowerCase()); return; } const n = JSON.parse(JSON.stringify(bonus)); fn(n); setBonus(n); };
  const updZ = (fn) => { if (!can("pricing")) { say("Needs permission: " + PL.pricing.toLowerCase()); return; } const n = JSON.parse(JSON.stringify(zc)); fn(n); setZc(n); };
  const dirtyB = JSON.stringify(bonus) !== JSON.stringify(pub), dirtyZ = JSON.stringify(zc) !== JSON.stringify(zp);
  const doSuspend = () => { const k = act.k, e = lists[k].find((x) => x.id === act.id), why = (REASONS[k].find((x) => x[0] === reason) || REASONS[k][0])[2]; patch[k](e.id, { st: "suspended" }); audit((e.st === "pending" ? "Rejected " : "Suspended ") + tag[k] + " " + e.n + " · " + why + (k === "c" ? "" : " · " + DURS.find((d) => d[0] === dur)[2])); say(e.n + (e.st === "pending" ? " rejected" : " suspended")); setAct(null); setReason(null); };
  const reinstate = (k, e) => { patch[k](e.id, { st: k === "r" ? "offline" : k === "v" ? "open" : "active", strikes: 0 }); audit("Reinstated " + tag[k] + " " + e.n); say(e.n + " reinstated"); };
  const doGift = () => { const k = act.k, e = lists[k].find((x) => x.id === act.id); if (k === "r") patch.r(e.id, { bonus: e.bonus + amt }); else patch.c(e.id, { wallet: e.wallet + amt }); setGifts([{ n: e.n, amt, note: note || (k === "r" ? "Bonus" : "Wallet credit"), by: RN, t: "Just now", k: k === "r" ? "rider" : "customer" }, ...gifts]); audit((k === "r" ? "Gifted bonus " : "Credited wallet ") + money(amt) + " to " + e.n); say(money(amt) + (k === "r" ? " bonus sent to " : " added to ") + e.n); setAct(null); setNote(""); };
  const warn = (e) => { const s = e.strikes + 1; if (s >= 3) { setR(e.id, { strikes: s, st: "suspended" }); audit("Auto-suspended " + e.n + " after 3 strikes"); say(e.n + " reached 3 strikes · suspended"); } else { setR(e.id, { strikes: s }); audit("Warned rider " + e.n + " (strike " + s + ")"); say("Strike " + s + " of 3 added"); } };
  const Rk = ({ a, b }) => <div className="rk"><span className="fl b">{a}</span><span className="xs mu">{b}</span></div>;
  const Bar = ({ a, p, r }) => <div style={{ marginTop: 10 }}><div className="row xs"><span className="fl b">{a}</span><span className="mu">{r || p + "%"}</span></div><div className="pb" style={{ marginTop: 5 }}><i style={{ width: Math.max(0, Math.min(100, p)) + "%" }} /></div></div>;
  const search = (k, ph) => <label className="srch"><Search size={15} className="mu" /><input value={qs[k]} onChange={(e) => setQs({ ...qs, [k]: e.target.value })} placeholder={ph} aria-label={ph} /></label>;
  const rolebar = <div className="rs" role="group" aria-label="Preview as role"><span className="lb" style={{ flex: "none" }}>Preview as</span>{Object.entries(ROLES).map(([k, r]) => <button key={k} className={role === k ? "on" : ""} aria-pressed={role === k} onClick={() => { setRole(k); say("Now viewing as " + r[0]); }}><UserCog size={14} />{r[0]}</button>)}</div>;
  const panel = () => <div className="cd hl"><div className="row"><div className="fl"><div className="lb">Order {o.id}</div><h2 className="serif" style={{ fontSize: 22 }}>{o.vend}</h2><div className="xs mu">{o.cust} · {money(o.amt)} · rider {o.rider || "not assigned"}</div></div><span className={cn("ch", can("chat") ? "g" : "")}>{can("chat") ? <><Check size={11} />Can intervene</> : <><Eye size={11} />Read only</>}</span></div>
    <div className="st">{STAGES.map((s, i) => <i key={s} className={i < o.st ? "d" : i === o.st ? "n" : ""} />)}</div><div className="xs mono ac">{orderStatusLabel(o)}</div>
    <div className="lb" style={{ margin: "16px 0 8px" }}>Everyone on this order · free in-app</div>
    <ContactBar key={o.id + role + can("chat") + can("call")} order={o.id} orderId={o.dbId} peers={peers} say={say} thread={threadFor(o.id)} />
    <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
      <button className="bt" disabled={!can("assign") || !isDispatchable(o) || ['delivered', 'cancelled'].includes(o.status)} onClick={() => setAsg(o.id)}>{can("assign") ? <RefreshCw size={14} /> : <Lock size={13} />}{o.riderId ? "Reassign rider" : "Assign rider"}</button>
      <button className="bt r" disabled={!can("refund")} onClick={() => refund(o.id, o.amt)}>{can("refund") ? <Undo2 size={14} /> : <Lock size={13} />}Refund</button></div>
    {(!can("chat") || !can("assign")) && <div className="xs mu" style={{ marginTop: 10 }}>Locked buttons show what your current role cannot do. Switch role in Preview as to compare.</div>}</div>;
  /* ── navigation ── */
  const nav = NAV.map((n) => ({ k: n[0], l: n[1], I: n[2], lk: !can(n[3]), go: () => go(n), b: n[0] === "live" ? attn : n[0] === "riders" ? pendR : n[0] === "support" ? openT : 0 }));
  const mnav = [...MOB.map((k) => nav.find((x) => x.k === k)), { k: MOB.includes(tab) ? "more" : tab, l: "More", I: Menu, go: () => setMore(true) }];
  /* ── people lists ── */
  const kinds = { r: ["rider", RS, ["all", "online", "delivering", "offline", "pending", "suspended"]], v: ["vendor", VS, ["all", "open", "paused", "pending", "suspended"]], c: ["customer", CS, ["all", "active", "flagged", "suspended"]] };
  const stOpts = (k) => kinds[k][2].map((x) => [x, "", x === "all" ? "All" : kinds[k][1][x][1]]);
  const filt = (k) => lists[k].filter((x) => (sf[k] === "all" || x.st === sf[k]) && (k !== "r" || sf.z === "all" || x.zone === sf.z) && x.n.toLowerCase().includes(qs[k].toLowerCase()));
  const rowOf = (k, x) => { const [cls, lab] = kinds[k][1][x.st]; return <button key={x.id} className="rk" style={{ width: "100%" }} onClick={() => setEnt({ k, id: x.id })}><Pa n={x.n} i={lists[k].indexOf(x)} /><div className="fl"><div className="b tr">{x.n}</div><div className="xs mu tr">{k === "r" ? x.zone + " · " + x.veh + (x.rate ? " · " + x.rate + "★" : "") : k === "v" ? x.kind + " · " + x.zone + (x.rate ? " · " + x.rate + "★" : "") : x.orders + " orders · " + money(x.spent)}</div></div><span className={cn("ch", cls)}>{lab}</span><ChevronRight size={16} className="mu" /></button>; };
  const mgmtBar = (k) => <div className="tbar">{search(k, "Search " + kinds[k][0] + "s")}<Drop label="Status" value={sf[k]} options={stOpts(k)} onPick={(v) => setSf({ ...sf, [k]: v })} />{k === "r" && <Drop label="Zone" value={sf.z} options={[["all", "", "All zones"], ...ZN.map((z) => [z, "", z])]} onPick={(v) => setSf({ ...sf, z: v })} />}</div>;
  const section = (k) => <><div className={cn("kp", kinds[k][2].length > 4 && "k4")}>{kinds[k][2].slice(1, 5).map((s) => <div key={s}><b>{lists[k].filter((x) => x.st === s).length}</b><span className="xs mu">{kinds[k][1][s][1]}</span></div>)}</div>
    {mgmtBar(k)}<div className="cd lst" style={{ padding: "2px 16px" }}>{filt(k).map((x) => rowOf(k, x))}{!filt(k).length && <p className="mu" style={{ padding: "18px 0", textAlign: "center" }}>Nobody matches.</p>}</div></>;
  /* ── sidebars (each section has its own priorities) ── */
  const supply = ZN.map((z) => [z, riders.filter((r) => r.zone === z && r.st === "online").length, 2]);
  const zs = (z) => zc.zones.find((x) => x.n === z);
  const sides = {
    live: <><SW title="Order flow">{[["Placed", "placed"], ["Preparing", "preparing"], ["Ready", "ready"], ["On the way", "on_the_way"], ["Delivered", "delivered"], ["Cancelled", "cancelled"]].map(([label, status]) => <Rk key={status} a={label} b={orders.filter((order) => order.status === status).length} />)}</SW><SW title="Delivery queue"><Rk a="Active orders" b={activeOrders.length} /><Rk a="Waiting for rider" b={unassignedOrders.length} /><Rk a="Past estimated ETA" b={overdueOrders.length} /><Rk a="Registered rider accounts" b={riderProfiles.length} /></SW></>,
    dispatch: <><SW title="Queue status"><Rk a="Waiting for rider" b={unassignedOrders.length} /><Rk a="Active assignments" b={activeOrders.length - unassignedOrders.length} /><Rk a="Registered rider accounts" b={riderProfiles.length} /></SW></>,
    riders: <><SW title="Rider snapshot"><Rk a="Online or delivering" b={riders.filter((r) => r.st === "online" || r.st === "delivering").length} /><Rk a="Pending approval" b={pendR} /><Rk a="Suspended" b={riders.filter((r) => r.st === "suspended").length} /></SW><SW title="Top this week">{[...riders].sort((a, b) => b.week - a.week).slice(0, 3).map((r, i) => <div key={r.id} className="rk"><span style={{ width: 22 }}>{["🥇", "🥈", "🥉"][i]}</span><span className="fl b">{r.n}</span><span className="mu">{r.week}</span></div>)}</SW><SW title="Watch list">{riders.filter((r) => r.strikes > 0 && r.st !== "suspended").map((r) => <Rk key={r.id} a={r.n} b={r.strikes + " strike" + (r.strikes > 1 ? "s" : "")} />)}</SW></>,
    vendors: <><SW title="Vendor snapshot"><Rk a="Open now" b={vends.filter((v) => v.st === "open").length} /><Rk a="Paused" b={vends.filter((v) => v.st === "paused").length} /><Rk a="Awaiting approval" b={vends.filter((v) => v.st === "pending").length} /></SW><SW title="Busiest today">{[...vends].sort((a, b) => b.orders - a.orders).slice(0, 3).map((v) => <Rk key={v.id} a={v.n} b={v.orders + " orders"} />)}</SW><SW title="Trending in Abuja"><Rk a="🍲 Jollof rice" b="↑ 18%" /><Rk a="🍢 Suya" b="↑ 12%" /><Rk a="🇬🇭 Ghanaian meals" b="↑ 24%" /></SW></>,
    customers: <><SW title="Customer snapshot"><Rk a="New this week" b="318" /><Rk a="Flagged" b={custs.filter((c) => c.st === "flagged").length} /><Rk a="Repeat rate" b="68%" /></SW><SW title="Top spenders">{[...custs].sort((a, b) => b.spent - a.spent).slice(0, 3).map((c) => <Rk key={c.id} a={c.n} b={money(c.spent)} />)}</SW><SW title="Refund watch">{[...custs].sort((a, b) => b.refunds - a.refunds).slice(0, 2).map((c) => <Rk key={c.id} a={c.n} b={c.refunds + " refunds"} />)}</SW></>,
    bonus: <><SW title="Budget today"><div className="b" style={{ fontSize: 20 }}>{money(spentToday)}</div><div className="pb" style={{ margin: "8px 0 4px" }}><i style={{ width: Math.min(100, spentToday / pub.budget * 100) + "%" }} /></div><div className="xs mu">of {money(pub.budget)} daily budget</div></SW><SW title="Closest to a milestone">{[...riders].filter((r) => r.st === "online" || r.st === "delivering").sort((a, b) => b.today - a.today).slice(0, 3).map((r) => <Rk key={r.id} a={r.n} b={r.today + " orders today"} />)}</SW><SW title="Eligibility"><Rk a="Meet all rules" b={riders.filter((r) => r.st !== "pending" && r.acc >= pub.minAcc && r.rate >= pub.minRate).length + " riders"} /><Rk a="Below the bar" b={riders.filter((r) => r.st !== "pending" && (r.acc < pub.minAcc || r.rate < pub.minRate)).length + " riders"} /></SW></>,
    support: <><SW title="Ticket health"><Rk a="Open" b={tix.filter((t) => t.st === "open").length} /><Rk a="In progress" b={tix.filter((t) => t.st === "prog").length} /><Rk a="Avg first reply" b="3 min" /></SW><SW title="Top issues today"><Bar a="Late orders" p={46} /><Bar a="Wrong or missing items" p={27} /><Bar a="Payments" p={15} /></SW></>,
    fees: <><SW title="Surge by zone">{ZN.map((z) => <Bar key={z} a={z} p={(zs(z).surge - 1) * 66 + 8} r={"×" + zs(z).surge.toFixed(1)} />)}</SW><SW title="Platform take"><Rk a="Vendor commission" b={zc.fees.comm + "%"} /><Rk a="Rider share of delivery fee" b={zc.fees.share + "%"} /></SW></>,
    money: <><SW title="Settlement calendar"><Rk a="Vendors" b="Daily · 6 PM" /><Rk a="Riders" b="Instant cash-out" /><Rk a="Bonuses" b={pub.pay === "weekly" ? "Weekly · Mon" : pub.pay === "daily" ? "Daily" : "Monthly"} /></SW><SW title="Waiting on finance"><Rk a="Refund requests" b={ref.length} /><Rk a="Payouts to approve" b={pay.filter((p) => p[2]).length} /></SW></>,
    team: <><SW title="Roles">{Object.entries(ROLES).map(([k, r]) => <Rk key={k} a={r[0]} b={team.filter((t) => t[1] === k).length + " people"} />)}</SW><SW title="Safe defaults"><p className="xs mu">Money actions are logged. Only a Super admin can change the matrix.</p></SW></>,
    audit: <><SW title="Most active today">{Object.entries(logs.reduce((m, l) => ({ ...m, [l[2]]: (m[l[2]] || 0) + 1 }), {})).map(([a, n]) => <Rk key={a} a={a} b={n + " actions"} />)}</SW><SW title="Risk alerts"><Rk a="Refunds over ₦10,000" b="1 today" /><Rk a="Role changes" b={logs.filter((l) => /Granted|Removed|Changed/.test(l[1])).length} /></SW></>,
    me: <><SW title="Shift"><Rk a="You are viewing as" b={RN} /><Rk a="Permissions" b={perms[role].length + " of " + PERMS.length} /></SW><SW title="Security"><p className="xs mu">Money and role changes are always written to the audit log.</p></SW></>,
  };
  const convs = [{ p: "cust", last: "Hello, I need help with my order.", t: "now", un: 1 }, { p: "vendor", last: "Rider has not arrived.", t: "6m" }, { p: "sup", last: "We're here if you need anything.", t: "1h" }];
  /* ── person detail dialog ── */
  const detail = () => {
    if (!E) return null; const k = ent.k; if (k === "r") PPL.rider.n = E.n; if (k === "v") PPL.vendor.n = E.n; if (k === "c") PPL.cust.n = E.n;
    const [cls, lab] = kinds[k][1][E.st], sus = E.st === "suspended", pen = E.st === "pending";
    const kp = k === "r" ? [[E.today, "Orders today"], [E.week, "This week"], [E.km + " km", "Distance"], [E.acc + "%", "Acceptance"]] : k === "v" ? [[E.orders, "Orders today"], [E.rate || "–", "Rating"], [E.comm + "%", "Commission"], [money(E.bal), "Balance"]] : [[E.orders, "Orders"], [money(E.spent), "Spent"], [money(E.wallet), "Wallet"], [E.refunds, "Refunds"]];
    return <Full dlg title={k === "r" ? "Rider" : k === "v" ? "Vendor" : "Customer"} onClose={() => setEnt(null)}>
      <div className="cd hl row"><Pa n={E.n} i={lists[k].indexOf(E)} s={56} /><div className="fl"><h2 className="serif" style={{ fontSize: 22 }}>{E.n}</h2><div className="xs mu">{k === "r" ? E.zone + " · " + E.veh + " · since " + E.since : k === "v" ? E.kind + " · " + E.zone : "Customer since " + E.since}</div></div><span className={cn("ch", cls)}>{lab}</span></div>
      <div className="kp k4">{kp.map(([a, b]) => <div key={b}><b style={{ fontSize: 18 }}>{a}</b><span className="xs mu">{b}</span></div>)}</div>
      {k === "r" && <div className="cd"><Rw t="Documents" d="Licence, vehicle papers and ID"><span className={cn("ch", E.docs ? "g" : "o")}>{E.docs ? "Verified" : "Missing"}</span></Rw><Rw t="Strikes" d="Three strikes suspend a rider automatically"><span className={cn("ch", E.strikes ? "o" : "g")}>{E.strikes} of 3</span></Rw><Rw t="Bonus earned this week"><b>{money(E.bonus)}</b></Rw></div>}
      {k === "v" && <div className="cd"><Rw t="Commission" d="Share of food value kept by the platform"><Stp v={E.comm} set={(v) => { if (!can("pricing")) { say("Needs permission: " + PL.pricing.toLowerCase()); return; } patch.v(E.id, { comm: v }); audit("Set " + E.n + " commission to " + v + "%"); }} step={0.5} min={5} max={25} f={(x) => x + "%"} dis={!can("pricing")} label="commission" /></Rw></div>}
      {k === "c" && <div className="cd"><Rw t="Account flag" d="Flagged accounts need a manager before refunds over ₦5,000"><button className="bt s" disabled={!can("users") || sus} onClick={() => { patch.c(E.id, { st: E.st === "flagged" ? "active" : "flagged" }); audit((E.st === "flagged" ? "Cleared flag on " : "Flagged ") + E.n); say(E.st === "flagged" ? "Flag cleared" : "Account flagged"); }}><Flag size={13} />{E.st === "flagged" ? "Clear flag" : "Flag"}</button></Rw></div>}
      {k !== "c" && <div className="cd"><Rw t="Payout account" d={(k === "r" ? "GTBank ···· 4417" : "GTBank ···· 9102") + " · name matches"}><span className={cn("ch", holds[E.id] ? "o" : "g")}>{holds[E.id] ? "On hold" : "Active"}</span></Rw><Rw t="Hold payouts" d="Pauses withdrawals while you investigate"><Tgl on={holds[E.id]} label="Hold payouts" set={() => { if (!can("payout")) { say("Needs permission: " + PL.payout.toLowerCase()); return; } setHolds({ ...holds, [E.id]: holds[E.id] ? 0 : 1 }); audit((holds[E.id] ? "Released payouts for " : "Held payouts for ") + E.n); say(holds[E.id] ? "Payouts released" : "Payouts on hold"); }} /></Rw></div>}
      <div className="cd"><div className="lb" style={{ marginBottom: 8 }}>Message or call · free in-app</div><ContactBar key={E.id + role} order={E.n} peers={[k === "r" ? "rider" : k === "v" ? "vendor" : "cust"]} say={say} thread={threadFor(E.n)} /></div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {pen && <><button className="bt p" disabled={!can("users")} onClick={() => { patch[k](E.id, { st: k === "r" ? "offline" : "open" }); audit("Approved " + tag[k] + " " + E.n); say(E.n + " approved"); }}>{can("users") ? <Check size={15} /> : <Lock size={13} />}Approve</button><button className="bt r" disabled={!can("users")} onClick={() => { setAct({ t: "susp", k, id: E.id }); setReason(REASONS[k][0][0]); }}><X size={14} />Reject</button></>}
        {!pen && k !== "v" && <button className="bt p" disabled={!can("gift") || sus} onClick={() => { setAct({ t: "gift", k, id: E.id }); setAmt(k === "r" ? 1000 : 500); }}>{can("gift") ? <Gift size={15} /> : <Lock size={13} />}{k === "r" ? "Gift bonus" : "Credit wallet"}</button>}
        {k === "v" && !pen && !sus && <button className="bt" disabled={!can("users")} onClick={() => { const p = E.st === "paused"; patch.v(E.id, { st: p ? "open" : "paused" }); audit((p ? "Resumed " : "Paused ") + E.n); say(E.n + (p ? " is open again" : " paused")); }}>{can("users") ? null : <Lock size={13} />}{E.st === "paused" ? "Resume orders" : "Pause orders"}</button>}
        {k === "r" && !pen && !sus && <button className="bt o" disabled={!can("users")} onClick={() => warn(E)}><TriangleAlert size={14} />Warn (strike)</button>}
        {!pen && (sus ? <button className="bt o" disabled={!can("users")} onClick={() => reinstate(k, E)}>{can("users") ? <UserCheck size={14} /> : <Lock size={13} />}Reinstate</button> : <button className="bt r" disabled={!can("users")} onClick={() => { setAct({ t: "susp", k, id: E.id }); setReason(REASONS[k][0][0]); }}>{can("users") ? <Ban size={14} /> : <Lock size={13} />}Suspend</button>)}</div>
      {(!can("users") || !can("gift")) && <div className="xs mu">Locked buttons show what your current role cannot do. Switch role in Preview as to compare.</div>}</Full>;
  };
  const bsim = calcB(bonus, sim);
  return <ThemeCtx.Provider value={th.cls}><div className={cn("dl", th.cls)}><style>{CSS + CSS2}</style>
    <Shell tkeys={TAB} onMore={() => setMore(true)} letter="O" role="Operations" nav={nav} mnav={mnav} tab={tab} setTab={setTab} mw={1100} convs={convs} notifs={NOTIFS} say={say} thread={{ canWrite: true, canCall: true, joinable: false }} who={"Viewing as " + RN} onProfile={() => setTab("me")} top={rolebar} side={sides[tab]}
      foot={<><div className="lb">Viewing as</div><div className="b" style={{ fontSize: 16, marginTop: 2 }}>{RN}</div><div className="xs mu" style={{ marginTop: 2 }}>{perms[role].length} of {PERMS.length} permissions</div></>}>
      {tab === "live" && <>
        <div className="kp k4"><div><b>{activeOrders.length}</b><span className="xs mu">Active orders</span></div><div><b>{riderProfiles.length}</b><span className="xs mu">Rider accounts</span></div><div><b>{attn}</b><span className="xs mu">Need attention</span></div><div><b>{unassignedOrders.length}</b><span className="xs mu">Need a rider</span></div></div>
        <div className="split"><div><div className="tbar" style={{ marginBottom: 10 }}><Drop label="Show" value={fl} options={[["all", "", "All orders"], ["late", "", "Late"], ["norider", "", "No rider"]]} onPick={setFl} /></div>
          {shown.map((x) => <button key={x.id} className={cn("oi", sel === x.id && "on")} onClick={() => { setSel(x.id); if (window.innerWidth < 1480) setDet(true); }}><div className="row"><b className="fl">{x.id}</b>{flag(x)}</div><div className="xs mu tr">{x.vend} → {x.cust}</div><div className="st">{STAGES.map((s, i) => <i key={s} className={i < x.st ? "d" : i === x.st ? "n" : ""} />)}</div><div className="xs mono ac">{orderStatusLabel(x)}</div></button>)}{!shown.length && <div className="cd mu" style={{ textAlign: "center" }}>Nothing matches.</div>}</div>
          <div className="dsk">{panel()}</div></div></>}
      {tab === "dispatch" && <>
        <p className="mu">{orders.filter((x) => !x.rider).length} orders waiting for a rider. Tap one to assign.</p>
        {orders.filter((x) => !x.riderId && !['delivered', 'cancelled'].includes(x.status)).map((x) => <div key={x.id} className="cd row"><div className="fl"><div className="b">{x.id} · {x.vend}</div><div className="xs mu">{x.cust}</div></div><button className="bt p s" onClick={() => setAsg(x.id)}>Assign</button></div>)}
        <div className="lb">Riders</div><div className="cd lst" style={{ padding: "2px 16px" }}>{riders.filter((r) => r.st === "online" || r.st === "delivering").map((r) => <div key={r.id} className="rk"><Bike size={18} className="ac" /><div className="fl"><div className="b">{r.n}</div><div className="xs mu">{r.zone} · {dist(r.id)} km from vendor</div></div><span className={cn("ch", r.st === "online" ? "g" : "")}>{r.st === "online" ? "Available" : "On delivery"}</span></div>)}</div></>}
      {['riders', 'vendors', 'customers', 'bonus', 'support', 'fees', 'money', 'team', 'audit'].includes(tab) && <DemoNotice>Sample data only. Changes in this section are stored in this browser session and are not persisted or enforced by the backend.</DemoNotice>}
      {tab === "riders" && section("r")}
      {tab === "vendors" && section("v")}
      {tab === "customers" && section("c")}
      {tab === "bonus" && <>
        <div className="row" style={{ flexWrap: "wrap" }}><div className="seg" style={{ flex: "0 1 380px", minWidth: 260 }} role="tablist">{[["rules", "Rules"], ["sim", "Simulator"], ["gifts", "Gifts"]].map(([k, l]) => <button key={k} role="tab" aria-selected={bsub === k} className={bsub === k ? "on" : ""} onClick={() => setBsub(k)}>{l}</button>)}</div><span className="fl" />
          {bsub === "rules" && <>{dirtyB && <span className="ch o">Unpublished changes</span>}<button className="bt s" disabled={!dirtyB} onClick={() => { setBonus(pub); say("Changes discarded"); }}>Discard</button><button className="bt p s" disabled={!dirtyB || !can("bonus")} onClick={() => { setPub(bonus); audit("Published new rider bonus rules"); say("Bonus rules published · riders see them now"); }}>{can("bonus") ? <Check size={14} /> : <Lock size={12} />}Publish rules</button></>}</div>
        {bsub === "rules" && <>
          <div className="cd"><div className="lb">Daily milestones · highest reached wins</div>{bonus.tiers.map(([n, a], i) => <div key={i} className="rk" style={{ flexWrap: "wrap" }}><span className="fl b">Complete</span><Stp v={n} set={(v) => upd((x) => { x.tiers[i][0] = v; })} min={i ? bonus.tiers[i - 1][0] + 1 : 1} max={i < bonus.tiers.length - 1 ? bonus.tiers[i + 1][0] - 1 : 99} f={(x) => x + " orders"} dis={!can("bonus")} label="orders" /><Stp v={a} set={(v) => upd((x) => { x.tiers[i][1] = v; })} step={100} min={100} f={money} dis={!can("bonus")} label="bonus" /><button className="ib" style={{ width: 34, height: 34 }} aria-label="Remove milestone" disabled={!can("bonus") || bonus.tiers.length < 2} onClick={() => upd((x) => { x.tiers.splice(i, 1); })}><Trash2 size={14} /></button></div>)}
            <button className="bt s o" style={{ marginTop: 10 }} disabled={!can("bonus") || bonus.tiers.length > 7} onClick={() => upd((x) => { const l = x.tiers[x.tiers.length - 1]; x.tiers.push([l[0] + 5, l[1] + 2000]); })}><Plus size={13} />Add milestone</button></div>
          <div className="cd"><div className="lb">Boosts</div>
            {[["lunch", "Lunch rush · 12–2 PM", "Multiplier on the delivery fee"], ["dinner", "Dinner rush · 5–8 PM", "Multiplier on the delivery fee"]].map(([k, t, d]) => <Rw key={k} t={t} d={d}><Stp v={bonus[k].m} set={(v) => upd((x) => { x[k].m = v; })} step={0.1} min={1} max={2.5} f={(x) => "×" + x.toFixed(1)} dis={!can("bonus") || !bonus[k].on} label={t} /><Tgl on={bonus[k].on} label={t} set={() => upd((x) => { x[k].on = x[k].on ? 0 : 1; })} /></Rw>)}
            {[["rain", "Rain boost", "Extra per order when it rains", 50, " /order"], ["far", "Long-distance bonus", "Per km beyond 5 km, per order", 10, " /km"], ["night", "Night rides · after 9 PM", "Extra per order", 50, " /order"]].map(([k, t, d, st, u]) => <Rw key={k} t={t} d={d}><Stp v={bonus[k].a} set={(v) => upd((x) => { x[k].a = v; })} step={st} min={0} f={(x) => money(x) + u} dis={!can("bonus") || !bonus[k].on} label={t} /><Tgl on={bonus[k].on} label={t} set={() => upd((x) => { x[k].on = x[k].on ? 0 : 1; })} /></Rw>)}
            <Rw t="Streak bonus" d={"Hit " + bonus.streak.orders + "+ orders a day for " + bonus.streak.days + " days in a row"}><Stp v={bonus.streak.a} set={(v) => upd((x) => { x.streak.a = v; })} step={500} min={500} f={money} dis={!can("bonus") || !bonus.streak.on} label="streak bonus" /><Tgl on={bonus.streak.on} label="Streak bonus" set={() => upd((x) => { x.streak.on = x.streak.on ? 0 : 1; })} /></Rw></div>
          <div className="cd"><div className="lb">Eligibility · keeps bonuses fair and safe</div>
            <Rw t="Minimum acceptance rate" d="Riders below this earn no bonus"><Stp v={bonus.minAcc} set={(v) => upd((x) => { x.minAcc = v; })} step={5} min={50} max={100} f={(x) => x + "%"} dis={!can("bonus")} label="acceptance" /></Rw>
            <Rw t="Minimum rating"><Stp v={bonus.minRate} set={(v) => upd((x) => { x.minRate = v; })} step={0.1} min={3.5} max={5} f={(x) => x.toFixed(1) + "★"} dis={!can("bonus")} label="rating" /></Rw>
            <Rw t="Maximum cancellations a week"><Stp v={bonus.maxCx} set={(v) => upd((x) => { x.maxCx = v; })} min={0} max={10} dis={!can("bonus")} label="cancellations" /></Rw>
            <Rw t="Documents must be valid" d="Suspended or unverified riders never earn bonuses"><Tgl on={bonus.docs} label="Documents must be valid" set={() => upd((x) => { x.docs = x.docs ? 0 : 1; })} /></Rw></div>
          <div className="cd"><div className="lb">Budget and payout</div>
            <Rw t="Daily bonus budget" d="Bonuses pause when this is reached"><Stp v={bonus.budget} set={(v) => upd((x) => { x.budget = v; })} step={50000} min={50000} f={money} dis={!can("bonus")} label="budget" /></Rw>
            <Rw t="Cap per rider per day"><Stp v={bonus.cap} set={(v) => upd((x) => { x.cap = v; })} step={1000} min={1000} f={money} dis={!can("bonus")} label="cap" /></Rw>
            <Rw t="Paid out"><Drop value={bonus.pay} options={[["daily", "", "Daily"], ["weekly", "", "Weekly"], ["monthly", "", "Monthly"]]} onPick={(v) => upd((x) => { x.pay = v; })} right /></Rw>
            <div style={{ marginTop: 10 }}><div className="row xs"><span className="fl">Spent today</span><b>{money(spentToday)} of {money(pub.budget)}</b></div><div className="pb" style={{ marginTop: 5 }}><i style={{ width: Math.min(100, spentToday / pub.budget * 100) + "%" }} /></div></div></div></>}
        {bsub === "sim" && <>
          <p className="mu">Try a rider's day against the current draft rules before you publish.</p>
          <div className="cd"><Rw t="Orders completed"><Stp v={sim.n} set={(v) => setSim({ ...sim, n: v, peak: Math.min(sim.peak, v), night: Math.min(sim.night, v) })} min={0} max={40} label="orders" /></Rw><Rw t="Orders in peak hours"><Stp v={sim.peak} set={(v) => setSim({ ...sim, peak: v })} min={0} max={sim.n} label="peak orders" /></Rw><Rw t="Average distance"><Stp v={sim.km} set={(v) => setSim({ ...sim, km: v })} min={1} max={15} f={(x) => x + " km"} label="distance" /></Rw><Rw t="Night orders"><Stp v={sim.night} set={(v) => setSim({ ...sim, night: v })} min={0} max={sim.n} label="night orders" /></Rw><Rw t="It rained today"><Tgl on={sim.rain} label="Rain" set={() => setSim({ ...sim, rain: sim.rain ? 0 : 1 })} /></Rw><Rw t="Acceptance rate"><Stp v={sim.acc} set={(v) => setSim({ ...sim, acc: v })} step={5} min={40} max={100} f={(x) => x + "%"} label="acceptance" /></Rw><Rw t="Rating"><Stp v={sim.rate} set={(v) => setSim({ ...sim, rate: v })} step={0.1} min={3} max={5} f={(x) => x.toFixed(1) + "★"} label="rating" /></Rw></div>
          <div className="cd hl"><div className="lb">Result</div>{bsim.L.map(([a, v]) => <div key={a} className="rk"><span className="fl">{a}</span><b>{money(v)}</b></div>)}<div className="rk"><span className="fl b">{bsim.ok ? "Bonus earned" : "Not eligible"}</span><b style={{ fontSize: 20 }} className={bsim.ok ? "ac" : ""}>{money(bsim.ok ? bsim.cap : 0)}</b></div>
            {!bsim.ok && <div className="pl w"><TriangleAlert size={15} />Below the minimum acceptance rate or rating, so no bonus is paid.</div>}{bsim.ok && bsim.raw > bsim.cap && <div className="pl w"><TriangleAlert size={15} />Capped at {money(bonus.cap)} per rider per day.</div>}</div></>}
        {bsub === "gifts" && <>
          <div className="cd"><div className="lb">Gift a rider</div><div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}><Drop value={gf.id} options={riders.filter((r) => r.st !== "pending" && r.st !== "suspended").map((r) => [r.id, "", r.n])} onPick={(v) => setGf({ ...gf, id: v })} /><div className="amt">{[500, 1000, 2000, 5000].map((a) => <button key={a} className={gf.amt === a ? "on" : ""} onClick={() => setGf({ ...gf, amt: a })}>{money(a)}</button>)}</div></div><div className="row" style={{ marginTop: 10 }}><input className="in" placeholder="Reason (shown to the rider)" aria-label="Reason" value={gf.note} onChange={(e) => setGf({ ...gf, note: e.target.value })} /><button className="bt p" disabled={!can("gift")} onClick={() => { const r = riders.find((x) => x.id === gf.id); setR(r.id, { bonus: r.bonus + gf.amt }); setGifts([{ n: r.n, amt: gf.amt, note: gf.note || "Bonus", by: RN, t: "Just now", k: "rider" }, ...gifts]); audit("Gifted bonus " + money(gf.amt) + " to " + r.n); say(money(gf.amt) + " bonus sent to " + r.n); setGf({ ...gf, note: "" }); }}>{can("gift") ? <Gift size={15} /> : <Lock size={13} />}Send</button></div></div>
          <div className="cd"><div className="lb">Recent gifts and credits</div>{gifts.map((g, i) => <div key={i} className="rk"><Gift size={16} className="ac" /><div className="fl"><div className="b">{g.n} · {money(g.amt)}</div><div className="xs mu">{g.note} · {g.by} · {g.t}</div></div><span className="ch">{g.k}</span></div>)}</div></>}
      </>}
      {tab === "support" && <>
        <div className="kp k4"><div><b>{tix.filter((t) => t.st === "open").length}</b><span className="xs mu">Open</span></div><div><b>{tix.filter((t) => t.st === "prog").length}</b><span className="xs mu">In progress</span></div><div><b>{tix.filter((t) => t.st === "done").length + 38}</b><span className="xs mu">Resolved today</span></div><div><b>3 min</b><span className="xs mu">First reply</span></div></div>
        <div className="tbar"><Drop label="Status" value={sf.t} options={[["all", "", "All"], ["open", "", "Open"], ["prog", "", "In progress"], ["done", "", "Resolved"]]} onPick={(v) => setSf({ ...sf, t: v })} /><Drop label="From" value={sf.a} options={[["all", "", "Everyone"], ["cust", "", "Customers"], ["rider", "", "Riders"], ["vendor", "", "Vendors"]]} onPick={(v) => setSf({ ...sf, a: v })} /></div>
        {tix.filter((t) => (sf.t === "all" || t.st === sf.t) && (sf.a === "all" || t.who === sf.a)).map((t) => { if (tk === t.id) PPL[t.who].n = t.name; return <div key={t.id} className={cn("cd", t.pr === "high" && t.st !== "done" && "hl")}>
          <button className="row" style={{ width: "100%" }} onClick={() => setTk(tk === t.id ? null : t.id)}><Ticket size={18} className="ac" /><div className="fl"><div className="b">{t.subj}</div><div className="xs mu">{t.id} · {t.name} · {t.cat}{t.order ? " · " + t.order : ""} · {t.age}</div></div><span className={cn("ch", t.pr === "high" ? "r" : t.pr === "med" ? "o" : "")}>{t.pr === "high" ? "Urgent" : t.pr === "med" ? "Normal" : "Low"}</span><span className={cn("ch", t.st === "done" ? "g" : t.st === "prog" ? "bl" : "")}>{t.st === "done" ? "Resolved" : t.st === "prog" ? "In progress" : "Open"}</span></button>
          {tk === t.id && <div className="col" style={{ marginTop: 12, gap: 12 }}><ContactBar key={t.id + role} order={t.order || t.id} peers={[t.who]} say={say} thread={threadFor(t.order || t.id)} />
            {t.st !== "done" && <div className="row" style={{ flexWrap: "wrap" }}>{t.st === "open" && <button className="bt" disabled={!can("tickets")} onClick={() => { setTix(tix.map((x) => (x.id === t.id ? { ...x, st: "prog" } : x))); audit("Took ticket " + t.id); say("Ticket assigned to you"); }}>{can("tickets") ? null : <Lock size={13} />}Take ticket</button>}<button className="bt p" disabled={!can("tickets")} onClick={() => setRes(t.id)}>{can("tickets") ? <Check size={15} /> : <Lock size={13} />}Resolve</button></div>}</div>}</div>; })}</>}
      {tab === "fees" && <>
        <div className="row" style={{ flexWrap: "wrap" }}><p className="mu fl">Changes go live for every app when you publish.</p>{dirtyZ && <span className="ch o">Unpublished changes</span>}<button className="bt s" disabled={!dirtyZ} onClick={() => { setZc(zp); say("Changes discarded"); }}>Discard</button><button className="bt p s" disabled={!dirtyZ || !can("pricing")} onClick={() => { setZp(zc); audit("Published fee and zone changes"); say("Fees and zones published"); }}>{can("pricing") ? <Check size={14} /> : <Lock size={12} />}Publish</button></div>
        <div className="cd"><div className="lb">Platform</div>
          <Rw t="Vendor commission" d="Default share of food value"><Stp v={zc.fees.comm} set={(v) => updZ((x) => { x.fees.comm = v; })} step={0.5} min={5} max={25} f={(x) => x + "%"} dis={!can("pricing")} label="commission" /></Rw>
          <Rw t="Rider share of delivery fee"><Stp v={zc.fees.share} set={(v) => updZ((x) => { x.fees.share = v; })} step={5} min={50} max={95} f={(x) => x + "%"} dis={!can("pricing")} label="rider share" /></Rw>
          <Rw t="Customer service fee"><Stp v={zc.fees.svc} set={(v) => updZ((x) => { x.fees.svc = v; })} step={25} min={0} max={500} f={money} dis={!can("pricing")} label="service fee" /></Rw>
          <Rw t="Minimum order"><Stp v={zc.fees.min} set={(v) => updZ((x) => { x.fees.min = v; })} step={250} min={0} max={10000} f={money} dis={!can("pricing")} label="minimum order" /></Rw></div>
        {zc.zones.map((z, i) => <div key={z.n} className="cd"><div className="row"><MapPin size={18} className="ac" /><span className="b fl">{z.n}</span><span className={cn("ch", z.on ? "g" : "")}>{z.on ? "Delivering" : "Paused"}</span><Tgl on={z.on} label={z.n} set={() => updZ((x) => { x.zones[i].on = x.zones[i].on ? 0 : 1; })} /></div>
          <Rw t="Base fee"><Stp v={z.base} set={(v) => updZ((x) => { x.zones[i].base = v; })} step={50} min={200} f={money} dis={!can("pricing")} label={z.n + " base fee"} /></Rw>
          <Rw t="Per kilometre"><Stp v={z.km} set={(v) => updZ((x) => { x.zones[i].km = v; })} step={5} min={20} f={money} dis={!can("pricing")} label={z.n + " per km"} /></Rw>
          <Rw t="Surge multiplier" d="Raises fees when demand is high"><Stp v={z.surge} set={(v) => updZ((x) => { x.zones[i].surge = v; })} step={0.1} min={1} max={2.5} f={(x) => "×" + x.toFixed(1)} dis={!can("pricing")} label={z.n + " surge"} /></Rw></div>)}</>}
      {tab === "money" && <>
        <WalletCard label="Platform float" amount={money(24800000 - pay.reduce((s, x) => s + x[2], 0))} id="Settlement account" note={money(pay.reduce((s, x) => s + x[2], 0)) + " awaiting approval"} spark={[21, 24, 22, 27, 25, 29, 28].map((x) => x * 100000)} sparkLabel="Float, last 7 days" foot="Payouts leave this float only after approval." />
        {pay.map(([t, n, a], i) => <div key={t} className="cd row"><Banknote size={20} className="ac" /><div className="fl"><div className="b">{t}</div><div className="xs mu">{n} · {money(a)}</div></div><button className="bt p s" disabled={!can("payout") || !a} onClick={() => { setPay(pay.map((x, j) => (j === i ? [x[0], x[1], 0] : x))); audit("Approved payout: " + t); say("Payout approved"); }}>{can("payout") ? (a ? "Approve" : "Paid") : <><Lock size={12} />Approve</>}</button></div>)}
        <div className="lb">Refund requests</div>{ref.map(([id, why, a]) => <div key={id} className="cd row"><div className="fl"><div className="b">{id}</div><div className="xs mu">{why} · {money(a)}</div></div><button className="bt r s" disabled={!can("refund")} onClick={() => { setRef(ref.filter((x) => x[0] !== id)); refund(id, a); }}>{can("refund") ? "Refund" : <><Lock size={12} />Refund</>}</button></div>)}{!ref.length && <div className="cd mu" style={{ textAlign: "center" }}>No pending refunds.</div>}
        <div className="lb">Payout account changes · review before money moves</div>{pac.map(([n, k, a, t]) => <div key={n} className="cd row"><Landmark size={20} className="ac" /><div className="fl"><div className="b">{n} · {k}</div><div className="xs mu">{a} · {t}</div></div><button className="bt s" disabled={!can("payout")} onClick={() => { setPac(pac.filter((x) => x[0] !== n)); audit("Held payouts for " + n + " pending bank check"); say(n + " on hold"); }}>Hold</button><button className="bt p s" disabled={!can("payout")} onClick={() => { setPac(pac.filter((x) => x[0] !== n)); audit("Approved new payout account for " + n + " (" + a + ")"); say("Account approved"); }}>{can("payout") ? "Approve" : <><Lock size={12} />Approve</>}</button></div>)}{!pac.length && <div className="cd mu" style={{ textAlign: "center" }}>No account changes to review.</div>}</>}
      {tab === "team" && <>
        <p className="mu">Click a cell to change what a role can do, then switch role in Preview as and watch the app change. The Super admin column is fixed.</p>
        <div className="cd" style={{ overflowX: "auto" }}><table className="mx"><thead><tr><th className="lb" style={{ textAlign: "left" }}>Permission</th>{Object.entries(ROLES).map(([k, r]) => <th key={k} className="lb cur" style={{ color: k === role ? "var(--at)" : undefined }}>{r[0]}</th>)}</tr></thead>
          <tbody>{PERMS.map(([p, l]) => <tr key={p}><td>{l}</td>{Object.keys(ROLES).map((k) => { const on = perms[k].includes(p); return <td key={k} className={k === role ? "cur" : ""}><button className={cn("cell", on && "on")} disabled={k === "admin"} aria-pressed={on} aria-label={ROLES[k][0] + " " + l} onClick={() => { setPerms({ ...perms, [k]: on ? perms[k].filter((x) => x !== p) : [...perms[k], p] }); audit((on ? "Removed " : "Granted ") + p + (on ? " from " : " to ") + ROLES[k][0]); }}>{on ? <Check size={15} /> : <X size={14} />}</button></td>; })}</tr>)}</tbody></table></div>
        <div className="cd"><div className="lb">Team</div>{team.map(([n, r], i) => <div key={n} className="rk"><Pa n={n} i={i} s={34} /><span className="fl b">{n}</span><Drop value={r} options={Object.entries(ROLES).map(([k, v]) => [k, "", v[0]])} onPick={(v) => { if (!can("team")) { say("Needs permission: " + PL.team.toLowerCase()); return; } setTeam(team.map((t) => (t[0] === n ? [n, v] : t))); audit("Changed " + n + " to " + ROLES[v][0]); say(n + " is now " + ROLES[v][0]); }} right /></div>)}</div></>}
      {tab === "audit" && <>
        <div className="tbar"><Drop label="By" value={sf.au} options={[["all", "", "Everyone"], ...[...new Set(logs.map((l) => l[2]))].map((x) => [x, "", x])]} onPick={(v) => setSf({ ...sf, au: v })} /></div>
        <div className="cd">{logs.filter((l) => sf.au === "all" || l[2] === sf.au).map(([t, m, w], i) => <div key={i} className="log"><ScrollText size={16} className="ac" /><div className="fl"><div>{m}</div><div className="xs mu">{w} · {t}</div></div></div>)}</div></>}
      {tab === "me" && <>
        <div className="cd hl row"><Av id="me" s={64} /><div className="fl"><h2 className="serif" style={{ fontSize: 22 }}>Operations HQ</h2><div className="xs mu">Abuja control room · {RN}</div></div><span className="ch g"><ShieldCheck size={11} />Verified</span></div>
        <div className="kp k4"><div><b>{perms[role].length}</b><span className="xs mu">Permissions</span></div><div><b>{logs.length}</b><span className="xs mu">Actions logged</span></div><div><b>{attn}</b><span className="xs mu">Need attention</span></div><div><b>{team.length}</b><span className="xs mu">Team</span></div></div>
        <div className="cd"><div className="lb">Preview as another role</div><div style={{ marginTop: 10 }}>{rolebar}</div></div>
        <button className="setrow" onClick={() => setSetOpen(true)}><Settings size={20} className="ac" /><span className="fl">Settings</span><ChevronRight size={18} className="mu" /></button></>}
    </Shell>
    {more && <Sheet title="All sections" onClose={() => setMore(false)}><div className="mgrid">{nav.map((n) => { const I = n.I; return <button key={n.k} className={cn("mt", tab === n.k && "on", n.lk && "lk")} onClick={n.go} aria-current={tab === n.k ? "page" : undefined}><span className="mi">{n.lk ? <Lock size={19} /> : <I size={21} />}{n.b ? <span className="bdg">{n.b}</span> : null}</span><span className="ml">{n.l}</span></button>; })}</div><p className="xs mu">Locked sections need a permission your current role does not have.</p></Sheet>}
    {det && <Full dlg title="Order" onClose={() => setDet(false)}>{panel()}</Full>}
    {ent && detail()}
    {act && act.t === "susp" && (() => { const e = lists[act.k].find((x) => x.id === act.id); return <Sheet title={(e.st === "pending" ? "Reject " : "Suspend ") + e.n} onClose={() => setAct(null)}><div className="lb">Reason</div><Drop value={reason || REASONS[act.k][0][0]} options={REASONS[act.k]} onPick={setReason} />{act.k !== "c" && <><div className="lb">For how long</div><Drop value={dur} options={DURS} onPick={setDur} /></>}<p className="xs mu">They are told why. This is written to the audit log.</p><button className="bt r w" onClick={doSuspend}><Ban size={15} />{e.st === "pending" ? "Reject" : "Suspend"} {e.n.split(" ")[0]}</button></Sheet>; })()}
    {act && act.t === "gift" && (() => { const e = lists[act.k].find((x) => x.id === act.id); return <Sheet title={(act.k === "r" ? "Gift bonus to " : "Credit wallet of ") + e.n} onClose={() => setAct(null)}><div className="amt">{[500, 1000, 2000, 5000].map((a) => <button key={a} className={amt === a ? "on" : ""} onClick={() => setAmt(a)}>{money(a)}</button>)}</div><input className="in" placeholder={act.k === "r" ? "Reason (shown to the rider)" : "Reason"} aria-label="Reason" value={note} onChange={(e2) => setNote(e2.target.value)} /><p className="xs mu">{act.k === "r" ? "Counts against today's bonus budget and shows in their Earnings." : "Added to their wallet right away."}</p><button className="bt p w" onClick={doGift}><Gift size={15} />Send {money(amt)}</button></Sheet>; })()}
    {res && (() => { const t = tix.find((x) => x.id === res); const fin = (m) => { setTix(tix.map((x) => (x.id === t.id ? { ...x, st: "done" } : x))); audit("Resolved " + t.id + " · " + m); say("Ticket resolved · " + m); setRes(null); setTk(null); }; return <Sheet title={"Resolve " + t.id} onClose={() => setRes(null)}><p className="mu">{t.subj}</p>{t.amt > 0 && <button className="mrow" disabled={!can("refund")} onClick={() => fin("refunded " + money(t.amt))}><Undo2 size={18} className="ac" /><span className="fl">Refund {money(t.amt)}{!can("refund") ? " (needs refund permission)" : ""}</span></button>}<button className="mrow" disabled={!can("gift")} onClick={() => fin("₦500 credit")}><Gift size={18} className="ac" /><span className="fl">Give ₦500 goodwill credit{!can("gift") ? " (needs gift permission)" : ""}</span></button><button className="mrow" onClick={() => fin("apology sent")}><MessageCircle size={18} className="ac" /><span className="fl">Apologise and close</span></button></Sheet>; })()}
    {asg && <Sheet title={"Assign rider to " + asg} onClose={() => setAsg(null)}>{riderProfiles.map((r) => <button key={r.id} className="ct2" onClick={() => void assign(r.id)}><Bike size={18} className="ac" /><div className="fl"><div className="b">{r.display_name || "Rider"}</div><div className="xs mu">Rider account</div></div><span className="ch g">Assign</span></button>)}{!riderProfiles.length && <p className="mu">No rider accounts are available to assign.</p>}</Sheet>}
    {setOpen && <Full title="Settings" onClose={() => setSetOpen(false)}>
      <div className="cd"><div className="lb" style={{ marginBottom: 10 }}>Appearance</div><ThemeSwitch th={th} /><p className="xs mu" style={{ marginTop: 8 }}>Light is bright and crisp for the control room. Dark is easy on the eyes on night shift. Auto follows the device.</p></div>
      <div className="cd"><div className="lb">Operations</div>{[["alert", "Late-order alerts", "Notify when an order passes its promised time"], ["confirm", "Confirm money actions", "Ask before refunds and payouts (recorded in Audit)"]].map(([k, t, d]) => <Rw key={k} t={t} d={d}><Tgl on={prefs[k]} label={t} set={() => { setPrefs({ ...prefs, [k]: prefs[k] ? 0 : 1 }); say(t + (prefs[k] ? " off" : " on")); }} /></Rw>)}</div>
      <div className="cd"><div className="lb">Help and support</div><div style={{ marginTop: 10 }}><ContactBar order="Support desk" peers={["sup"]} say={say} /></div></div>
      <SignOut say={say} who="Operations HQ" /></Full>}
    <Toast t={toast} /></div></ThemeCtx.Provider>;
}