// 1. mongoose 모듈 가져오기
var mongoose = require('mongoose');

// 2. testDB 세팅
mongoose.connect('mongodb://localhost:27017/testDB', { useNewUrlParser: true, useUnifiedTopology: true });

// 3. 연결된 testDB 사용
var db = mongoose.connection;

// 4. 연결 실패
db.on('error', function(){
    console.log('Connection Failed!');
});

// 5. 연결 성공
db.once('open', function() {
    console.log('Connected!');
});

// 6. Schema 생성
const studentSchema = new mongoose.Schema({
    name: {type:String, required:[true]},
    address: {type:String,required : [true]},
    age: {type:Number,required : [true]}
});

// 7. collection 생성. 있을경우 생성안함
var studentModel = mongoose.model('Teacher', studentSchema);

// 8. Student 객체를 new 로 생성해서 값을 입력
var newStudent = new studentModel({ name: 'Hong Gil Dong', address: '서울시 강남구 논현동', age: 22 });

newStudent.save()


