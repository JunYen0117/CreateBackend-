// 套件引用
const express = require('express');
const router = express.Router();

// 連接資料庫
const pool = require('../utils/database');
const checkConToller = require('../utils/checkLogin');

router.use((req, res, next) => {
  console.log('request is coming couponRouter');
  next();
});

// 撈出使用者全部可領取的優惠券 (coupon_send_status=1)
// localhost:3003/api/coupons/available?page=1
router.get('/available', async (req, res, next) => {
  console.log('撈出全部的優惠券:可領取的優惠券列表');

  let page = req.query.page || 1;
  console.log('current page', page);

  let [availableList] = await pool.execute('SELECT * FROM coupon WHERE coupon.id NOT IN (SELECT coupon_id from coupon_take where customer_id=1) AND coupon_send_status=1;');

  const total = availableList.length;
  console.log('total:', total);

  const perPage = 4; // 每一頁有幾筆
  const lastPage = Math.ceil(total / perPage);
  console.log('lastPage:', lastPage);

  let offset = (page - 1) * perPage;
  console.log('offset:', offset);

  let [pageAvailableList] = await pool.execute(
    'SELECT * FROM coupon WHERE coupon.id NOT IN (SELECT coupon_id from coupon_take where customer_id=1) AND coupon_send_status=1 LIMIT ? OFFSET ?',
    [perPage, offset]
  );

  res.json({
    // 用來儲存所有跟頁碼有關的資訊
    pagination: {
      total,
      lastPage,
      page,
      offset,
    },
    // 真正的資料
    availableList: pageAvailableList,
  });
  console.log(availableList);
});

// 撈出全部使用者可使用的優惠券
// localhost:3003/api/coupons/receive?page=1
router.get('/receive', async (req, res, next) => {
  console.log('使用者擁有的優惠券:可使用的優惠券列表');

  let receivePage = req.query.page || 1;
  console.log('current receivePage', receivePage);

  let [receiveList] = await pool.execute('SELECT * FROM coupon right JOIN coupon_take on coupon.id = coupon_id where customer_id=1 AND coupon_status=1;');
  const receiveTotal = receiveList.length;
  console.log('receiveTotal:', receiveTotal);

  const receivePerPage = 2; // 每一頁有幾筆
  const receiveLastPage = Math.ceil(receiveTotal / receivePerPage);
  console.log('lastPage:', receiveLastPage);

  let receiveOffset = (receivePage - 1) * receivePerPage;
  console.log('receiveOffset:', receiveOffset);

  let [pageReceiveList] = await pool.execute('SELECT * FROM coupon right JOIN coupon_take on coupon.id = coupon_id where customer_id=1 AND coupon_status=1 LIMIT ? OFFSET ?', [
    receivePerPage,
    receiveOffset,
  ]);

  res.json({
    // 用來儲存所有跟頁碼有關的資訊
    pagination: {
      receiveTotal,
      receiveLastPage,
      receivePage,
      receiveOffset,
    },
    // 真正的資料
    receiveList: pageReceiveList,
  });
  console.log('receiveList:', receiveList);
});

// 撈出全部使用者擁有的優惠券但已失效
// localhost:3003/api/coupons/invalid?page=1
router.get('/invalid', async (req, res, next) => {
  console.log('使用者擁有的優惠券但已失效：可使用的優惠券列表');

  let invalidPage = req.query.page || 1;
  console.log('current invalidPage', invalidPage);

  let [invalidList] = await pool.execute('SELECT * FROM coupon right JOIN coupon_take on coupon.id = coupon_id where customer_id=1 AND coupon_status=0;');
  const invalidTotal = invalidList.length;

  console.log('invalidTotal:', invalidTotal);

  const invalidPerPage = 4; // 每一頁有幾筆
  const invalidLastPage = Math.ceil(invalidTotal / invalidPerPage);
  console.log('invalidLastPage:', invalidLastPage);

  let invalidOffset = (invalidLastPage - 1) * invalidPerPage;
  console.log('invalidOffset:', invalidOffset);

  let [pageInvalidList] = await pool.execute('SELECT * FROM coupon right JOIN coupon_take on coupon.id = coupon_id where customer_id=1 AND coupon_status=0 LIMIT ? OFFSET ?', [
    invalidPerPage,
    invalidOffset,
  ]);

  res.json({
    // 用來儲存所有跟頁碼有關的資訊
    pagination: {
      invalidTotal,
      invalidLastPage,
      invalidPage,
      invalidOffset,
    },
    // 真正的資料
    invalidList: pageInvalidList,
  });
  console.log('invalidList:', invalidList);
});

// Create coupon
// router.post("/insertCoupon", async (req, res, next) => {
//   let { customer_id ,coupon_id, coupon_status, take_time } = req.body;
//   let [insertCoupon] = await pool.execute(
//     "INSERT INTO coupon_take (customer_id ,coupon_id,coupon_status,take_time) VALUES (?, ?, ?, ?, ?)",
//     [customer_id ,coupon_id,coupon_status,take_time]
//   );
//   res.send(insertCoupon);
// });

// 領取優惠券
// localhost:3003/api/coupons/insertCoupon;
router.post('/insertCoupon', async (req, res, next) => {
  const date = new Date();

console.log(req.body);
  // 正式用版本--資料庫
  let [insertCoupon] = await pool.execute('INSERT INTO coupon_take (customer_id ,coupon_id,coupon_status,take_time) VALUE (?,?,?,?)', [
    req.body.customer_id,
    req.body.coupon_id,
    1,
    date,
  ]);

  let [updateCoupon] = await pool.execute('UPDATE coupon SET quota = quota-1 where id = ? AND quota>0', [req.body.coupon_id]);

  res.json({
    insertCoupon, // 領取的優惠券
    updateCoupon, // 更新優惠券數量
    msg: '領取成功',
  });
});









// 單一優惠券的分頁
// router.get('/:couponNum', async (req, res, next) => {
// 取得網址上的參數 req.params
// req.params.couponNum
//   console.log('get coupon by id', req.params);

//   let page = req.query.page || 1;
//   console.log('current page', page);

// 2. 取得目前的總筆數
// (這邊可能要改寫一下， 優惠券編碼是不需要做分頁的)
//   let [allResults] = await pool.execute('SELECT * FROM coupon WHERE coupon_no = ?', [req.params.couponNum]);
//   const total = allResults.length;
//   console.log('total:', total);

// 3. 計算總共有幾頁
// Math.ceil 1.1 => 2   1.05 -> 2
//   const perPage = 2; // 每一頁有幾筆
//   const lastPage = Math.ceil(total / perPage);
//   console.log('lastPage:', lastPage);

// 4. 計算 offset 是多少（計算要跳過幾筆）
// 在第五頁，就是要跳過 4 * perPage
//   let offset = (page - 1) * perPage;
//   console.log('offset:', offset);

// 5. 取得這一頁的資料 select * from table limit ? offset ?
// let [pageCoupons] = await pool.execute('SELECT * FROM coupon WHERE coupon_no = ? ORDER BY id DESC LIMIT ? OFFSET ?', [req.params.couponNum, perPage, offset]);

// 6. 回覆給前端
//   res.json({
// 用來儲存所有跟頁碼有關的資訊
//     pagination: {
//       total,
//       lastPage,
//       page,
//     },
// 真正的資料
//     couponList: pageCoupons,
//   });
// });

module.exports = router;
