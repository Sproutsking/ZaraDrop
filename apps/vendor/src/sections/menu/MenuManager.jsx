export default function MenuManager({ menu, menuDraft, setMenuDraft, menuSaving, saveMenuItem, money, guard, setMenu, say, setAvailability, Tgl }) {
  return <>
    <p className="mu">Switch an item off the moment it runs out. Customers stop seeing it instantly.</p>
    <form className="cd row" onSubmit={saveMenuItem}><input className="in fl" required placeholder="Item name" aria-label="Item name" value={menuDraft.name} onChange={(event) => setMenuDraft({ ...menuDraft, name: event.target.value })} /><input className="in" required type="number" min="0" step="1" placeholder="Price" aria-label="Price" value={menuDraft.price} onChange={(event) => setMenuDraft({ ...menuDraft, price: event.target.value })} /><button className="bt p" disabled={menuSaving}>{menuSaving ? 'Adding…' : 'Add item'}</button></form>
    {menu.map(([name, price, available, itemId]) => <div key={itemId} className="cd row"><div className="fl"><div className="b">{name}</div><div className="xs mu">{money(price)}</div></div><span className={available ? 'ch g' : 'ch r'}>{available ? 'Available' : 'Sold out'}</span>
      <Tgl on={!!available} label={name} set={guard('menu', () => setAvailability(itemId, name, available))} /></div>)}
  </>;
}
