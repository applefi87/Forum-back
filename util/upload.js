import file from '../classesOut.js'
import boards from '../models/boards.js'


const out = file.map((c) => {
  const data = {
    "title": c.className,
    "parent": "62f26cb065e7568850863720",
    "colData": [
      { "n": "score", "d": c.score },
      { "n": "required", "d": c.required },
      { "n": "english", "d": c.english },
      { "n": "department", "d": c.department },
      { "n": "classNameEng", "d": c.classNameEng },
      { "n": "classCode", "d": c.classCode }
    ],
    // "intro": "各校選課評價",
    "childBoard": {
      "active": false,
    }
  }
  const colD = []
  const col = Object.keys(c).map((d) => {
    // 欄位資料  (名子多存一次，到時決定是否拔掉)
    if (d != "unique") {
      return { "n": d, "d": c[d] }
    }
  })
  const uni = c.unique.map((u) => {
    const u = c.unique
    const dataU = [
      { "n": "semester", "d": u.semester },
      { "n": "teacher", "d": u.teacher },
      { "n": "serialCode", "d": u.serialCode },
      { "n": "location", "d": u.location },
      { "n": "time", "d": u.time },
      { "n": "class", "d": u.class },
      { "n": "others", "d": u.others },
      { "n": "condition", "d": u.condition },
      { "n": "team", "d": u.team },
      { "n": "grade", "d": u.grade },
      { "n": "gender", "d": u.gender }
    ]
    return dataU
  })
  data.uniqueData = uni
  return data
})
await boards.create(out)