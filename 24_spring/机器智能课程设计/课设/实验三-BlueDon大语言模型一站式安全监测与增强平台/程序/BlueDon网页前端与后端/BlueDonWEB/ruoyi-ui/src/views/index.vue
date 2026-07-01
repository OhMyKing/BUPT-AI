<template>
  <div>
    <!-- 固定的PNG图片 -->
    <img src="../assets/images/logo_name.png" alt="Fixed Image" style="width: 25%; height: auto; display: block; margin: 0 auto;">

    <el-carousel height  = '70vh' interval="4000">
      <el-carousel-item v-for="item in images" :key="item.id">
        <img :src="item.src" alt="Carousel Image" class="carousel-image">
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 图片列表，存储轮播图图片的路径
      images: [
        { id: 1, src: require('@/assets/information/1.png') },
        { id: 2, src: require('@/assets/information/2.png') },
        { id: 3, src: require('@/assets/information/3.png') },
        { id: 4, src: require('@/assets/information/4.png') },
        { id: 5, src: require('@/assets/information/5.png') },
        { id: 6, src: require('@/assets/information/6.png') },
        { id: 7, src: require('@/assets/information/7.png') },
        { id: 8, src: require('@/assets/information/8.png') },
        { id: 9, src: require('@/assets/information/9.png') },
        { id: 10, src: require('@/assets/information/10.png') },
        { id: 11, src: require('@/assets/information/11.png') },
        { id: 12, src: require('@/assets/information/12.png') },
        { id: 13, src: require('@/assets/information/13.png') },
        { id: 14, src: require('@/assets/information/14.png') },
        { id: 15, src: require('@/assets/information/15.png') },
        { id: 16, src: require('@/assets/information/16.png') },
        { id: 17, src: require('@/assets/information/17.png') },
      ]
    };
  }
};
</script>

<style scoped lang="scss">

.carousel-image {
  display: block;      /* 使用块级元素，确保可以应用margin自动属性 */
  max-width: 100%;     /* 最大宽度不超过容器宽度 */
  max-height: 100%;    /* 最大高度不超过容器高度 */
  margin: auto;        /* 上下左右外边距自动，使元素水平和垂直居中 */
  object-fit: contain; /* 保持图片原有比例 */
}


.el-carousel__item {
  background-color: transparent; /* 设置默认背景色，可根据需要更改 */
}

.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>

