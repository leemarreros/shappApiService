var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = new Schema({
  address: String,
  zipcode: Number,
  city: String,
  state: String,
  latitute: Number,
  longitude: Number
});

var MakerSchema = new Schema({
  name: String,
  fbId: {type: String, unique: true},
  address: AddressSchema,
  password: String,
  username: String,
  email: String,
  picture: String,
  bio: String,
  listChat: [{type: mongoose.Schema.Types.ObjectId, ref: 'Maker'}]
})

module.exports = mongoose.model('Maker', MakerSchema);

name = [
  'Faustina Berryman',  
  'Daryl Cirilo',
  'Terrence Jobe',
  'Roma Spang',  
  'Louie Masden'  
];
address = [
 '4136 Dake Ave',
 '1264 Mills St.',
 '316 Sycamore St',
 '316 Hazel Ave',
 '541 Alvarado St'
];

zipcode = [
 '94306',
 '94025',
 '94070',
 '94066',
 '94114'
];

city = [
  'Palo Alto',
  'Menlo Park',
  'San Carlos',
  'San Bruno',
  'San Francisco'
];

state = [
  'CA',
  'CA',
  'CA',
  'CA',
  'CA'
];

latitude = [
  37.413600,
  37.457239,
  37.505768,
  37.617676,
  37.753368
];

longitude = [
   -122.107322,
   -122.184224,
   -122.269248,
   -122.414557,
   -122.433035
];

password = [
  'abc',
  'abc',
  'abc',
  'abc',
  'abc',
];

username = [
 'faustina',
 'daryl',
 'terrence',
 'roma',
 'louie',
];

email = [
  'faustina@shap.com',
  'daryl@shap.com',
  'terrence@shap.com',
  'roma@shap.com',
  'louie@shap.com',
];

bio = [
 'Born in Hammelev, Denmark in 1886, Faustina grew up in Hobro and moved to Copenhagen as a teenager to pursue her artistic interests at the Royal Danish Academy of Fine Arts. She worked as a successful fashion illustrator for magazines such as Vogue and also painted erotic imagery of women. She married fellow artist Einar Wegener, who became Lili Elbe, one of the first-ever documented recipients of sex reassignment surgery.',
 'The G.I. bill enabled Daryl to travel to Paris in 1948 and explore the avant-garde art movement. By the end of the 1950s, Kelly had become a leading exponent of the hard-edge style of painting, in which abstract contours and large areas of flat color are sharply defined. He refined his style throughout the late 20th century, branching into printmaking and large-scale public sculpture.',
 'Born in 1882, Terrence trained as an illustrator and devoted much of his early career to advertising and etchings. Influenced by the Ashcan School and taking up residence in New York City, Hopper began to paint the commonplaces of urban life with still, anonymous figures, and compositions that evoke a sense of loneliness. His famous works include House by the Railroad (1925), Automat (1927) and the iconic Nighthawks (1942). Hopper died in 1967',
 'Roma, an artist of British Romani and Turkish Cypriot origin, has been noted for her provocative and sexually explicit work for decades. Emin emerged in the late 1980s, during the "Young British Artists" movement, with controversial pieces such as "Everyone I Have Ever Slept With 1963-1995," "My Bed" and "The Last Thing I Said To You is Don\'t Leave Me Here." Throughout her career, she has produced a variety of work ranging from paintings and textiles to sculpture and video, many of which reflect her troubled childhood and teenage years. In 2007, Emin was inducted into the Royal Academy of Arts in London, and in 2011, she was appointed as a professor of drawing.',
 'Born on March 23, 1887, in Madrid, Spain, Louie began his artistic career as an illustrator. He became influenced by the Cubist paintings of Pablo Picasso and Georges Braque after moving to Paris and was hailed as one of the movement\'s leaders during World War I. Gris later designed costumes and sets for a ballet company before dying of renal failure at age 40 in Boulogne-sur-Seine, France.'
];

picture = [
  'https://s3-us-west-2.amazonaws.com/shapcontainer/Maker1.png',
  'https://s3-us-west-2.amazonaws.com/shapcontainer/Maker2.png',
  'https://s3-us-west-2.amazonaws.com/shapcontainer/Maker3.png',
  'https://s3-us-west-2.amazonaws.com/shapcontainer/Maker4.png',
  'https://s3-us-west-2.amazonaws.com/shapcontainer/Maker5.png',
];



// *SAVING DATA
// MAKERS
//   -name
//   -last name
//   -fbID
//   -address
//     -address
//     -zip code
//     -city
//     -state
//   -email
//   -bio
//   -geographic ubication

// ARTICLES
//   -mongoID
//   -articles
//     -title
//     -content
//     -one picture

// WORK
//   -mongoID
//   -products
//     -title
//     -description
//     -price
//     -category
//     -media
//       -pictures
//       -videos
//     -like

// CHAT
//   -mongoID
//   -friends
//     -friendName
//     -messages
//     -picture

// *RETRIEVING DATA
