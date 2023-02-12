const router = require('express').Router();
const { Tag, Product, ProductTag, Category } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagsData = await Tag.findAll({
      include: [{model: Product}],
    });
    res.status(200).json(tagsData);
  } catch (err) {
    res.status(500).json(err);
  }

});

//get one tag
router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
 try {
  const tagsData = await Tag.findByPk(req.params.id, {
    include: [{model: Product}],
  });
  if (!tagsData) {
    res.status(404).json({message: 'No tag found with that id'});
    return;
  }
  res.status(200).json(tagsData);
 } catch (err) {
  res.status(500).json(err);
 }
});

  // create a new tag
router.post('/', (req, res) => {
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.tagIds.length) {
        const tagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            tag_id: tag.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(tagIdArr);
      }
      res.status(200).json(tag);
    })
    .then((tagIds) => res.status(200).json(tagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
  });
  
// update a tag's name by its `id` value
router.put('/:id', (req, res) => { 
  Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
  .then((tag) => {
// find all associated tags from ProductTag
    return ProductTag.findAll({ where: { tag_id: req.params.id} });
  })
  .then((productTags) => {
  // get list of current tag_ids
    const productTagIds = productTags.map(({ tag_id }) => tag_id);
   // create filtered list of new tag_ids
    const newProductTags = req.body.tagIds
    .filter((tag_id) => !productTagIds.includes(tag_id))
    .map((tag_id) => {
      return {
        tag_id: req.params.id,
        tag_id,
        tag_name,
      };
    });
  // figure out which ones to remove
    const tagsToRemove = productTags
    .filter(({ tag_id}) => !req.body.tagIds.includes(tag_id))
    .map(({ id }) => id);

 // run both actions
    return Promise.all([
      ProductTag.destroy({ where: { id: tagsToRemove} }),
      ProductTag.bulkCreate(newProductTags),
    ]);
  })
  .then((updatedTags) => res.json(updatedTags))
  .catch((err) => {
    res.status(400).json(err);
  });
});

 // delete on tag by its `id` value
router.delete('/:id', (req, res) => {
 Tag.destroy({ 
  where: {
    tag_id: req.params.tag_id,
  },
 })
 .then((deleteTag) => {
  res.json(deleteTag);
 })
 .catch((err) => res.json(err));
});

module.exports = router;
