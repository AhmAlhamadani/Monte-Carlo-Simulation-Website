declare module "jstat" {
  interface JStat {
    normal: {
      inv: (p: number, mean: number, sd: number) => number;
    };
    randn: (n?: number, m?: number) => number | number[][];
  }

  const jStat: JStat;
  export default jStat;
}
