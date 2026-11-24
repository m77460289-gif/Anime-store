package com.niga.store;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class StoreController {
 private final JdbcTemplate jdbc;private final PasswordEncoder encoder;private final JwtService jwt;
 public StoreController(JdbcTemplate jdbc,PasswordEncoder encoder,JwtService jwt){this.jdbc=jdbc;this.encoder=encoder;this.jwt=jwt;}

 @GetMapping("/health") public Map<String,Object> health(){return Map.of("status","UP","service","niga-store-api","runtime","Java");}
 @GetMapping("/products") public List<Map<String,Object>> products(){
  return jdbc.query("SELECT id,name,description,category,price_toman,stock,image_url,active FROM products WHERE active=TRUE ORDER BY id DESC",(rs,row)->productMap(rs));
 }
 @PostMapping("/auth/register") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> register(@RequestBody Map<String,Object> b){
  String name=text(b.get("name")),email=text(b.get("email")).toLowerCase(Locale.ROOT),password=text(b.get("password"));
  if(name.isBlank()||email.isBlank()||!email.contains("@")||password.length()<8)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"نام، ایمیل معتبر و رمز عبور حداقل ۸ کاراکتری لازم است.");
  try{jdbc.update("INSERT INTO store_users(name,email,password_hash,role) VALUES(?,?,?,'CUSTOMER')",name,email,encoder.encode(password));}
  catch(org.springframework.dao.DuplicateKeyException ex){throw new ResponseStatusException(HttpStatus.CONFLICT,"این ایمیل قبلاً ثبت شده است.");}
  return authResult(findUser(email));
 }
 @PostMapping("/auth/login") public Map<String,Object> login(@RequestBody Map<String,Object>b){
  String email=text(b.get("email")).toLowerCase(Locale.ROOT),password=text(b.get("password"));Map<String,Object> user;
  try{user=findUser(email);}catch(org.springframework.dao.EmptyResultDataAccessException ex){throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"ایمیل یا رمز عبور درست نیست.");}
  if(!encoder.matches(password,text(user.get("password_hash"))))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"ایمیل یا رمز عبور درست نیست.");
  return authResult(user);
 }
 @GetMapping("/auth/me") public Map<String,Object> me(java.security.Principal p){return publicUser(findUser(p.getName()));}

 @PostMapping("/orders") @ResponseStatus(HttpStatus.CREATED) @Transactional
 public Map<String,Object> createOrder(java.security.Principal principal,@RequestBody Map<String,Object>b){
  String fullName=text(b.get("fullName")),phone=text(b.get("phone")),address=text(b.get("address")),note=text(b.get("note"));
  Object raw=b.get("items");
  if(fullName.isBlank()||phone.isBlank()||address.isBlank()||!(raw instanceof List<?> items)||items.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"اطلاعات گیرنده و حداقل یک محصول لازم است.");
  Map<String,Object> user=findUser(principal.getName());long userId=((Number)user.get("id")).longValue();
  List<Map<String,Object>> checked=new ArrayList<>();long total=0;
  for(Object entry:items){
   if(!(entry instanceof Map<?,?> line))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"سبد خرید معتبر نیست.");
   long productId=number(line.get("productId"),0);int qty=(int)number(line.get("quantity"),0);
   if(productId<1||qty<1||qty>30)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"تعداد محصول معتبر نیست.");
   Map<String,Object> p;
   try{p=jdbc.queryForMap("SELECT id,name,price_toman,stock,image_url,active FROM products WHERE id=?",productId);}
   catch(org.springframework.dao.EmptyResultDataAccessException ex){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"یکی از محصولات پیدا نشد.");}
   long price=((Number)p.get("price_toman")).longValue();
   if(!Boolean.TRUE.equals(p.get("active"))||price<=0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"یکی از محصولات هنوز آماده فروش نیست.");
   Object available=p.get("stock");
   if(available instanceof Number n&&n.intValue()<qty)throw new ResponseStatusException(HttpStatus.CONFLICT,"موجودی محصول «"+p.get("name")+"» کافی نیست.");
   try{total=Math.addExact(total,Math.multiplyExact(price,qty));}catch(ArithmeticException ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"مبلغ سفارش بیش از حد مجاز است.");}
   Map<String,Object> item=new LinkedHashMap<>();item.put("id",productId);item.put("name",p.get("name"));item.put("image",p.get("image_url"));item.put("price",price);item.put("quantity",qty);checked.add(item);
  }
  KeyHolder kh=new GeneratedKeyHolder();
  jdbc.update(conn->{PreparedStatement ps=conn.prepareStatement("INSERT INTO store_orders(user_id,customer_name,phone,address,note,total_toman,status) VALUES(?,?,?,?,?,?,'PENDING')",Statement.RETURN_GENERATED_KEYS);ps.setLong(1,userId);ps.setString(2,fullName);ps.setString(3,phone);ps.setString(4,address);ps.setString(5,note);ps.setLong(6,total);return ps;},kh);
  Number key=kh.getKey();if(key==null)throw new IllegalStateException("شناسه سفارش ساخته نشد.");long orderId=key.longValue();
  for(Map<String,Object> item:checked){
   long pid=((Number)item.get("id")).longValue();int qty=((Number)item.get("quantity")).intValue();
   Object stock=jdbc.queryForObject("SELECT stock FROM products WHERE id=?",Object.class,pid);
   if(stock instanceof Number){int updated=jdbc.update("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",qty,pid,qty);if(updated!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"موجودی محصول تغییر کرده؛ دوباره تلاش کن.");}
   jdbc.update("INSERT INTO order_items(order_id,product_id,product_name,image_url,unit_price_toman,quantity) VALUES(?,?,?,?,?,?)",orderId,pid,item.get("name"),item.get("image"),item.get("price"),qty);
  }
  return Map.of("id",orderId,"totalToman",total,"status","PENDING","message","سفارش ثبت شد؛ پرداخت آنلاین هنوز به درگاه بانکی متصل نشده است.");
 }
 @GetMapping("/orders/me") public List<Map<String,Object>> myOrders(java.security.Principal p){
  long uid=((Number)findUser(p.getName()).get("id")).longValue();
  return jdbc.query("SELECT id,total_toman,status,created_at FROM store_orders WHERE user_id=? ORDER BY created_at DESC",(rs,row)->{
   Map<String,Object> m=new LinkedHashMap<>();m.put("id",rs.getLong("id"));m.put("totalToman",rs.getLong("total_toman"));m.put("status",rs.getString("status"));m.put("createdAt",rs.getTimestamp("created_at"));return m;
  },uid);
 }
 @GetMapping("/admin/orders") public List<Map<String,Object>> allOrders(){
  return jdbc.query("SELECT id,customer_name,total_toman,status,created_at FROM store_orders ORDER BY created_at DESC",(rs,row)->{
   Map<String,Object> m=new LinkedHashMap<>();m.put("id",rs.getLong("id"));m.put("customerName",rs.getString("customer_name"));m.put("totalToman",rs.getLong("total_toman"));m.put("status",rs.getString("status"));m.put("createdAt",rs.getTimestamp("created_at"));return m;
  });
 }
 @PatchMapping("/admin/orders/{id}/status") public Map<String,Object> updateStatus(@PathVariable long id,@RequestBody Map<String,Object>b){
  String status=text(b.get("status")).toUpperCase(Locale.ROOT);
  if(!Set.of("PENDING","PROCESSING","SHIPPED","COMPLETED","CANCELLED").contains(status))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"وضعیت سفارش معتبر نیست.");
  if(jdbc.update("UPDATE store_orders SET status=? WHERE id=?",status,id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"سفارش پیدا نشد.");
  return Map.of("id",id,"status",status);
 }
 @PostMapping("/admin/products") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> createProduct(@RequestBody Map<String,Object>b){
  String name=text(b.get("name"));long price=number(b.get("priceToman"),-1);if(name.isBlank()||price<0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"نام و قیمت معتبر لازم است.");
  Integer stock=nullableInt(b.get("stock"));KeyHolder kh=new GeneratedKeyHolder();
  jdbc.update(conn->{PreparedStatement ps=conn.prepareStatement("INSERT INTO products(name,description,category,price_toman,stock,image_url,active) VALUES(?,?,?,?,?,?,TRUE)",Statement.RETURN_GENERATED_KEYS);ps.setString(1,name);ps.setString(2,text(b.get("description")));ps.setString(3,defaultText(b.get("category"),"سایر"));ps.setLong(4,price);if(stock==null)ps.setNull(5,Types.INTEGER);else ps.setInt(5,stock);ps.setString(6,text(b.get("imageUrl")));return ps;},kh);
  return Map.of("id",kh.getKey().longValue(),"message","محصول ساخته شد.");
 }
 @PutMapping("/admin/products/{id}") public Map<String,Object> updateProduct(@PathVariable long id,@RequestBody Map<String,Object>b){
  String name=text(b.get("name"));long price=number(b.get("priceToman"),-1);if(name.isBlank()||price<0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"نام و قیمت معتبر لازم است.");
  Integer stock=nullableInt(b.get("stock"));int changed=jdbc.update(conn->{PreparedStatement ps=conn.prepareStatement("UPDATE products SET name=?,description=?,category=?,price_toman=?,stock=?,image_url=? WHERE id=?");ps.setString(1,name);ps.setString(2,text(b.get("description")));ps.setString(3,defaultText(b.get("category"),"سایر"));ps.setLong(4,price);if(stock==null)ps.setNull(5,Types.INTEGER);else ps.setInt(5,stock);ps.setString(6,text(b.get("imageUrl")));ps.setLong(7,id);return ps;});
  if(changed==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"محصول پیدا نشد.");return Map.of("id",id,"message","محصول به‌روزرسانی شد.");
 }
 @DeleteMapping("/admin/products/{id}") public Map<String,Object> deleteProduct(@PathVariable long id){
  if(jdbc.update("UPDATE products SET active=FALSE WHERE id=?",id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"محصول پیدا نشد.");return Map.of("id",id,"message","محصول غیرفعال شد.");
 }
 @PostMapping("/contact") @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> contact(@RequestBody Map<String,Object>b){
  String name=text(b.get("name")),email=text(b.get("email")),message=text(b.get("message"));
  if(name.isBlank()||!email.contains("@")||message.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"نام، ایمیل معتبر و متن پیام لازم است.");
  jdbc.update("INSERT INTO contact_messages(name,email,subject,message) VALUES(?,?,?,?)",name,email,text(b.get("subject")),message);
  return Map.of("message","پیام ذخیره شد.");
 }
 private Map<String,Object> findUser(String email){return jdbc.queryForMap("SELECT id,name,email,password_hash,role FROM store_users WHERE email=?",email);}
 private Map<String,Object> authResult(Map<String,Object>u){return Map.of("token",jwt.issue(text(u.get("email")),text(u.get("role"))),"user",publicUser(u));}
 private Map<String,Object> publicUser(Map<String,Object>u){Map<String,Object>m=new LinkedHashMap<>();m.put("id",u.get("id"));m.put("name",u.get("name"));m.put("email",u.get("email"));m.put("role",u.get("role"));return m;}
 private Map<String,Object> productMap(ResultSet rs)throws SQLException{
  Map<String,Object>m=new LinkedHashMap<>();m.put("id",rs.getLong("id"));m.put("name",rs.getString("name"));m.put("description",rs.getString("description"));m.put("category",rs.getString("category"));m.put("priceToman",rs.getLong("price_toman"));int stock=rs.getInt("stock");m.put("stock",rs.wasNull()?null:stock);m.put("imageUrl",rs.getString("image_url"));m.put("active",rs.getBoolean("active"));return m;
 }
 private static String text(Object v){return v==null?"":String.valueOf(v).trim();}
 private static String defaultText(Object v,String fallback){String s=text(v);return s.isBlank()?fallback:s;}
 private static long number(Object v,long fallback){try{return v instanceof Number n?n.longValue():Long.parseLong(text(v));}catch(Exception ex){return fallback;}}
 private static Integer nullableInt(Object v){if(v==null||text(v).isBlank())return null;long n=number(v,-1);if(n<0||n>Integer.MAX_VALUE)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"موجودی معتبر نیست.");return(int)n;}
}