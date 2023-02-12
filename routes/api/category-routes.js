const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  // find all categories
  // be sure to include its associated Products
 try {
  const categoryData = await Category.findAll({
    include: [{model: Product}]
  });
  res.status(200).json(categoryData);
 } catch (err) {
  res.status(500).json(err);
 }
});

//get one category
router.get('/:id', async (req, res) => {
  // find one category by its `id` value
  // be sure to include its associated Products
  try {
    const categoryData = await Category.findByPk(req.params.id, {
      include: [{model: Product}],
    });
    if (!categoryData) {
      res.status(404).json({message: 'No category found with that id'});
      return;
    }
    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json(err);
  }
});

  // create a new category
router.post('/', (req, res) => {
  Category.create(req.body)
  .then((category) => {
// if there's category ids, we need to create pairings to bulk create in the product model
    if (req.body.categoryId.length) {
      const productCategoryIdArr = req.body.categoryId.map((category_id) => {
        return {
          category_id: category.id,
          category_id,
        };
      });
      return Product.bulkCreate(productCategoryIdArr);
    }
    // if no product just respond
    res.status(200).json(category);
  })
  .then((productCategoryId) => res.status(200).json(productCategoryId))
 .catch((err) => {
  console.log(err);
  res.status(400).json(err);
 });
});

// update a category by its `id` value
router.put('/:id', (req, res) => {
  Category.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
  .then((category) => {
      // find all associated categories from product
     return Product.findAll({ where: { category_id: req.params.id} });
  })
  .then((categories) => {
     // get list of current category_ids
    const categoryIds = categories.map(({ category_id}) => category_id);
    // create filtered list of new category_ids
    const newCategories = req.body.categoryId
    .filter((category_id) => !categoryIds.includes(category_id))
    .map((category_id) => {
      return {
        category_id: req.params.id,
        category_id,
      };
    });
 // figure out which ones to remove
  const categoryIdsToRemove = categories
    .filter(({ category_id}) => !req.body.categoryId.includes(category_id))
    .map(({ id}) => id);

    //run both actions
    return Promise.all([
      Category.destroy({ where: { id: categoryIdsToRemove} }),
      Category.bulkCreate(newCategories),
    ]);
    })
  .then((updatedCategory) => res.json(updatedCategory))
  .catch((err) => {
    res.status(400).json(err);
  });
  });

router.delete('/:id', (req, res) => {
  // delete a category by its `id` value
  Category.destroy({
    where: {
      category_id: req.params.category_id,
    },
  })
  .then((deleteCategory) => {
    res.json(deleteCategory);
  })
  .catch((err) => res.json(err));
});

module.exports = router;
